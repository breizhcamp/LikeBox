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

/** Room's name of the polling box */
var room = 'Ouessant';

/** Current voting session */
var currentSession;

var screen = lcd('/dev/i2c-1', 0x27, 4, 20),
	greenButton = button(23),
	redButton = button(24),
	schedule = scheduleReader('schedule.json');

/** Display current voting session on the LCD screen */
function displayCurrentSession() {
	if (state != 'voting') return;

	schedule.getCurrentSession(room).then(function(session) {
		currentSession = session;

		screen.goto(0,0);
		screen.print(currentSession.title.substr(0, 40));
		displayRemainingTime();

		return votes.getCount(session.id);

	}).then(function(votes) {
		currentSession.m = votes.m;
		currentSession.p = votes.p;
		displayVoteCount();

		setTimeout(displayCurrentSession, 3000);
	});
}

/** Display the voting remaining time on the LCD screen */
function displayRemainingTime() {
	var nbMinLeft = moment().diff(moment(currentSession.endVote), 'minutes');
	if (nbMinLeft >= 0) {
		displayCurrentSession();
		return;
	}
	screen.goto(0,2);
	screen.print('Tps restant: ' + nbMinLeft + 'min');
}

/** Display current vote count on the LCD screen */
function displayVoteCount() {
	screen.goto(0,3);
	screen.print(' - : ' + currentSession.m + '    + : ' + currentSession.p + ' ');
}

/**
 * Function to call when a user push a button during the voting mode
 * @param button {string} 'red' or 'green' depending of the button pressed
 */
function userVoted(button) {
	console.log("User pressed [" + button + "] button");

	state = 'voted';
	screen.goto(0,2);
	screen.print("       A VOTE       ");

	votes.addVote(0, button == 'green' ? 'p' : 'm');
	if (button == 'green') {
		currentSession.p++;
	} else {
		currentSession.m++;
	}
	displayVoteCount();

	setTimeout(function() {
		state = 'voting';
		displayRemainingTime();
	}, 2000);
}

//--- BINDING BUTTONS ---
greenButton.events().on('released', function(){
	if (state == 'voting') {
		userVoted('green');
	}
});

redButton.events().on('released', function(){
	if (state == 'voting') {
		userVoted('red');
	}
});

//--- VOTE INITIALISATION ---
votes.start().then(function() {
	//database opened successfully, switching to voting mode
	state = 'voting';

	displayCurrentSession();
});


setInterval(function() {
	if (state == 'voting') {
		votes.getCount(currentSession.id).then(function(data) {
			console.log("-: " + data.m + " | +: " + data.p);
		});
//		votes.listVotes(1399592105779, function(votes) {
//			console.log(votes);
//		});
	}
}, 1000);