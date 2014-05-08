/**
 * Node file for client poll machine
 */
var debug = process.env.DEBUG,
	button = debug ? require('./button_virtual.js') : require('./button.js'),
	lcd = debug ? require('./lcd_virtual.js') : require('./lcd.js');

var screen = lcd('/dev/i2c-1', 0x27, 4, 20);

var greenButton = button(23);
greenButton.events().on('released', function(){
	console.log("+1 VOTED");
	screen.goto(5,3);
	screen.print("+1 VOTED");
});

var redButton = button(24);
redButton.events().on('released', function(){
	console.log("-1 VOTED");
	screen.goto(5,3);
	screen.print("-1 VOTED");
});

setInterval(function() {
	screen.goto(1,0);
	screen.print("Développer en calecon");

}, 1000);

setInterval(function() {
	screen.goto(2,2);
	screen.print("hello");
}, 800);