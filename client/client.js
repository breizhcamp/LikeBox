/**
 * Node file for client poll machine
 */
var debug = process.env.DEBUG,
	button = debug ? require('./modules/button_virtual.js') : require('./modules/button.js'),
	lcd = debug ? require('./modules/lcd_virtual.js') : require('./modules/lcd.js'),
	scheduleReader = require('./modules/schedule.js'),
	confMod = require('./modules/conf.js'),
	moment = require('moment'),
	winston = require('winston');

// -- init modules --
var screen = lcd('/dev/i2c-1', 0x27, 4, 20),
	greenButton = button(23),
	redButton = button(24),
	schedule = scheduleReader('schedule.json'),
	conf = confMod('config.json'),
	votes = require('./modules/votes.js')(),
	rest = require('./modules/rest_client.js')(conf, schedule, votes, winston);

winston.remove(winston.transports.Console)
	.add(winston.transports.Console, { timestamp: true });

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

/** Current voting session */
var currentSession;

/** do blinking dot to have visual feedback that the program still running */
var dot = true;

/** Load current voting session and display it on the LCD */
function loadCurrentSession() {
	if (state != 'voting') {
		setTimeout(loadCurrentSession, 3000);
		return;
	}

	//blink dot
	if (state == 'voting') {
		screen.goto(19,3).print(dot ? '.' : ' ');
		dot = !dot;
	}

	schedule.getCurrentSession(conf.roomName).then(function(session) {
		if (session) {
			if (!currentSession || currentSession.id != session.id) {
				//reload only if we change session
				return votes.getCount(session.id).then(function(votes) {
					currentSession = session;
					currentSession.m = votes.m;
					currentSession.p = votes.p;
					displayCurrentSession();
					displayRemainingTime();
					displayVoteCount();
				});
			} else {
				//same session, only update remaining time
				displayRemainingTime();
			}
		} else {
			displayNoSession(currentSession);
			currentSession = session;
		}

	}).fin(function() {
		setTimeout(loadCurrentSession, 3000);

	}).fail(function(err) {
		winston.error("Error when loading current session", err);
	});
}

/**
 * Display no session message on LCD screen
 * @param clear True if we have to clear screen before printing the message
 */
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
	var nbMinLeft = moment(currentSession.endVote).diff(moment(), 'minutes');
	if (nbMinLeft < 0 && currentSession) {
		loadCurrentSession();
		return;
	}
	if (nbMinLeft == 0) nbMinLeft = "<1";

	screen.goto(0,2).print(('Reste ' + nbMinLeft + 'min de vote  ').substr(0, nbCols));
}

/** Display current vote count on the LCD screen */
function displayVoteCount() {
	screen.goto(0,3);
	screen.print(('   Nb votes : ' + (currentSession.m + currentSession.p) + '     ').substr(0, nbCols-1));
	//remove 1 col to print "dot"
}

/**
 * Function to call when a user push a button during the voting mode
 * @param vote numeric Vote value: -1 or 1
 */
function userVoted(vote) {
	winston.info("User vote [" + vote + "]");
	//don't allow vote if no voting session
	if (!currentSession) return;

	state = 'voted';
	screen.goto(0,2).print("       A VOTE       ");

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

//--- BOX INITIALISATION ---
if (!conf.roomName) {
	winston.error("Room name not defined, goto config menu");

} else {
	//normal startup
	votes.start().then(function() {
		//database opened successfully, switching to voting mode
		state = 'voting';

		rest.start();
		loadCurrentSession();
	});
}

//debug if needed
if (debug) {
	setInterval(function() {
		if (state == 'voting' && currentSession) {
			votes.getCount(currentSession.id).then(function(data) {
				winston.debug("-: " + data.m + " | +: " + data.p);
			});
		}
	}, 3000);
}
