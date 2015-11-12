/**
 * Node file for client poll machine
 */
var debug = process.env.DEBUG,
	verbose = process.env.VERBOSE,
	button = debug ? require('./modules/button_virtual.js') : require('./modules/button.js'),
	lcd = debug ? require('./modules/lcd_virtual.js') : require('./modules/lcd.js'),
	scheduleReader = require('./modules/schedule.js'),
	moment = require('moment'),
	winston = require('winston'),
	ip = require('ip'),
	sleep = require('sleep');


// -- init modules --
var screen = lcd('/dev/i2c-1', 0x27, 4, 20),
	greenButton = button(24),
	redButton = button(23),
	schedule = scheduleReader('schedule.json'),
	boxId = process.env.BOX_ID,
	votes = require('./modules/votes.js')(),
	rest = require('./modules/rest_client.js')(boxId, schedule, votes, winston);

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

//--- LOGGING CONFIG ---
winston.remove(winston.transports.Console);

winston.add(winston.transports.File, {
	timestamp: true,
	filename: '/tmp/vote-client.log',
	maxsize: 1024*1024*5, //5 MB
	maxFiles: 5
});

if (verbose) {
	winston.add(winston.transports.Console, { timestamp: true });
}


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

	schedule.getCurrentSession().then(function(session) {
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

function hello() {
        screen.clear();
        screen.goto(3,0).print('   LikeBox #' + boxId);
        screen.goto(0,1).print('--------------------');
        screen.goto(0,2).print(moment().format("D MM YYYY HH:mm:ss"));
        screen.goto(0,3).print(ip.address());
        sleep.sleep(4);
        screen.clear();
}

/**
 * Display no session message on LCD screen
 * @param clear True if we have to clear screen before printing the message
 */
function displayNoSession(clear) {
	if (clear) screen.clear();
	screen.goto(3,1).print('NO ACTIVE SESSION');
	screen.goto(2,2).print('* * * * * * * * *');
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

	screen.goto(0,2).print((nbMinLeft + 'min left to vote').substr(0, nbCols));
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
	screen.goto(0,2).print("      THANKS !      ");

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

/** Function called to exit the client */
function exit() {
	screen.clear().goto(0,1).print('SHUTING DOWN...');
	process.exit(0);
}

hello();

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
if (typeof boxId === "undefined") {
	winston.error("Box ID not defined, goto config menu");

} else {
	//normal startup
	votes.start().then(function() {
		//database opened successfully, switching to voting mode
		state = 'voting';

		rest.start();
		loadCurrentSession();
	});
}

process.on('SIGINT', exit);
process.on('SIGTERM', exit);

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
