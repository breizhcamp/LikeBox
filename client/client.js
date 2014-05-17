/**
 * Node file for client poll machine
 */
var debug = process.env.DEBUG,
	button = debug ? require('./modules/button_virtual.js') : require('./modules/button.js'),
	lcd = debug ? require('./modules/lcd_virtual.js') : require('./modules/lcd.js'),
	scheduleReader = require('./modules/schedule.js'),
	votes = require('./modules/votes.js')(),
	moment = require('moment');

/**
 * State of the vote machine. Could be the following state :
 * - init: init mode (opening database, getting current session...)
 * - voting: voting in progress (displaying current session, time left for voting, and votes count)
 * - voted: the user has just vote, displaying confirmation message and blocking for 2 seconds
 * @type {string}
 */
var state = 'init';

/** Number of cols on the LCD screen */
var nbCols = 20;

/** Room's name of the polling box */
var room = 'Ouessant';

/** Current voting session */
var currentSession;

var screen = lcd('/dev/i2c-1', 0x27, 4, 20),
	greenButton = button(23),
	redButton = button(24),
	schedule = scheduleReader('schedule.json');

/** Load current voting session and display it on the LCD */
function loadCurrentSession() {
	if (state != 'voting') return;

	schedule.getCurrentSession(room).then(function(session) {
		var oldSession = currentSession;
		currentSession = session;

		if (session) {
			displayCurrentSession();
			displayRemainingTime();

			return votes.getCount(session.id).then(function(votes) {
				currentSession.m = votes.m;
				currentSession.p = votes.p;
				displayVoteCount();
			});
		} else {
			displayNoSession(oldSession);
		}

	}).fin(function() {
		setTimeout(loadCurrentSession, 3000);

	}).fail(console.log);
}

function displayNoSession(clear) {
	if (clear) screen.clear();
	screen.goto(3,1).print('AUCUNE SESSION');
	screen.goto(2,2).print('EN COURS DE VOTE');
}

/** Display the current voting session on the LCD screen */
function displayCurrentSession() {
	var title = currentSession.title + '                                        '; //padding screen
	screen.goto(0, 0).print(title.substr(0, nbCols * 2));
}

/** Display the voting remaining time on the LCD screen */
function displayRemainingTime() {
	var nbMinLeft = moment(currentSession.endVote).diff(moment('2014-05-22 11:35:27'), 'minutes');
	if (nbMinLeft <= 0) {
		loadCurrentSession();
		return;
	}
	screen.goto(0,2).print(('Reste ' + nbMinLeft + 'min de vote  ').substr(0, nbCols));
}

/** Display current vote count on the LCD screen */
function displayVoteCount() {
	screen.goto(0,3);
	screen.print(('   Nb votes : ' + (currentSession.m + currentSession.p) + '     ').substr(0, nbCols));
}

/**
 * Function to call when a user push a button during the voting mode
 * @param vote numeric Vote value: -1 or 1
 */
function userVoted(vote) {
	console.log("User vote [" + vote + "]");
	//don't allow vote if no voting session
	if (!currentSession) return;

	state = 'voted';
	screen.goto(0,2);
	screen.print("       A VOTE       ");

	votes.addVote(currentSession.id, vote);
	if (vote == 1) {
		currentSession.p++;
	} else {
		currentSession.m++;
	}
	displayVoteCount();

	setTimeout(function() {
		state = 'voting';
		displayRemainingTime();
	}, 800);
}

//--- BINDING BUTTONS ---
greenButton.events().on('released', function(){
	if (state == 'voting') {
		userVoted(1);
	}
});

redButton.events().on('released', function(){
	if (state == 'voting') {
		userVoted(-1);
	}
});

//--- VOTE INITIALISATION ---
votes.start().then(function() {
	//database opened successfully, switching to voting mode
	state = 'voting';

	loadCurrentSession();
});


setInterval(function() {
	if (state == 'voting' && currentSession) {
		votes.getCount(currentSession.id).then(function(data) {
			console.log("-: " + data.m + " | +: " + data.p);
		});
//		votes.listVotes(1399592105779, function(votes) {
//			console.log(votes);
//		});
	}
}, 3000);