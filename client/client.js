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
		screen.print(session.title.substr(0, 40));

		screen.goto(0,2);
		var nbMinLeft = moment().diff(moment(session.endVote), 'minutes');
		screen.print('Tps restant: ' + nbMinLeft + 'min');

		setTimeout(displayCurrentSession, 50000);
	});
}

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

schedule.getRooms().then(function(rooms) {
	console.log(rooms);
	return schedule.getCurrentSession('Ouessant');

}).then(function(session) {
	console.log(session);
	return votes.start();

}).then(function() {
	//database opened successfully, switching to voting mode
	state = 'voting';
});

/**
 * Function to call when a user push a button during the voting mode
 * @param button {string} 'red' or 'green' depending of the button pressed
 */
function userVoted(button) {
	console.log("User pressed [" + button + "] button");
	votes.addVote(0, button == 'green' ? 'p' : 'm');
}

setInterval(function() {
	if (state == 'voting') {
		votes.getCount(0).then(function(data) {
			console.log("-: " + data.m + " | +: " + data.p);
		});
//		votes.listVotes(1399592105779, function(votes) {
//			console.log(votes);
//		});
	}
}, 1000);