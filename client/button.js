var Gpio = require('onoff').Gpio,
	exec = require('child_process').exec,
	eventEmitter = require('events').EventEmitter,
	debounceMs = 500; //nb of ms for software debounce

/**
 * Module handling action buttons
 * @param pinNum GPIO Pin number connected to the button, other to the GND
 */
module.exports = function(pinNum) {
	/** eventEmitter sendind pushed or released events */
	var events = new eventEmitter();

	/** State of the button: up or down */
	var state = 'up';


	//init pull up by invoking python script
	var pythonScript = 'import RPi.GPIO as GPIO\n' +
		'GPIO.setmode(GPIO.BCM)\n' +
		'GPIO.setup(' + pinNum + ', GPIO.IN, pull_up_down=GPIO.PUD_UP)';

	exec("python -c '" + pythonScript + "'", function(err, stdout, stderr){
		if (err !== null) {
			throw "Can't init button with python script: " + stderr;
		}


		//listening to onoff module event
		var button = new Gpio(pinNum, 'in', 'both'),
			lastDown = 0, lastUp = 0, count = 0; //to avoid bounces

		button.watch(function(err, value) {
			var now = Date.now();
			if (!value) {
				if (now - lastDown > debounceMs) {
					lastDown = now;
					//console.log('Bouton ' + pinNum + ' appuyé: ' + count++);
					state = 'down';
					events.emit('pushed');
				}
			} else {
				if (now - lastUp > debounceMs) {
					lastUp = now;
					//console.log('Bouton ' + pinNum + ' relaché');
					state = 'up';
					events.emit('released');
				}
			}
		});
	});

	return {
		events: function() { return events; },
		state: function() { return state; }
	}
};