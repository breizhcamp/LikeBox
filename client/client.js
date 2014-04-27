/**
 * Node file for client poll machine
 */
var debug = process.env.DEBUG,
	button = debug ? require('./button_virtual.js') : require('./button.js');

var greenButton = button(23);
greenButton.events().on('released', function(){
	console.log("+1 VOTED");
});

var redButton = button(24);
redButton.events().on('released', function(){
	console.log("-1 VOTED");
});
