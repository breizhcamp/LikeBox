/**
 * Node file for client poll machine
 */
var debug = process.env.DEBUG,
	button = debug ? require('./button_virtual.js') : require('./button.js'),
	lcd = debug ? require('./lcd_virtual.js') : require('./lcd.js'),
	votes = require('./votes.js')();

/**
 * State of the vote machine. Could be the following state :
 * - init: init mode (opening database, getting current session...)
 * - voting: voting in progress (displaying current session, time left for voting, and votes count)
 * - voted: the user has just vote, displaying confirmation message and blocking for 2 seconds
 * @type {string}
 */
var state = 'init';

var screen = lcd('/dev/i2c-1', 0x27, 4, 20),
	greenButton = button(23),
	redButton = button(24);

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

votes.start(function() {
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
		votes.getCount(0, function(data) {
			console.log("-: " + data.m + " | +: " + data.p);
		});
//		votes.listVotes(1399592105779, function(votes) {
//			console.log(votes);
//		});
	}
}, 1000);