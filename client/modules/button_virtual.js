var http = require('http'),
	eventEmitter = require('events').EventEmitter;

/**
 * Virtual button for testing purpose. Opens an http server on port 90pinNum.
 * Can receive request to /pushed to emulate pushing the button, /released for releasing the button or
 * /click to simulate the pushed and button release within 500ms.
 * @param pinNum Number of the pin to emulate, used for http port number (9027 if pinNum is 27)
 */
module.exports = function(pinNum) {
	/** eventEmitter sendind pushed or released events */
	var events = new eventEmitter(),
		state = 'up';

	var server = http.createServer(function(request, response) {
		if (request.url == '/pushed') {
			state = 'down';
			events.emit('pushed');
			response.end("OK\n");

		} else if (request.url == '/released') {
			state = 'up';
			events.emit('released');
			response.end("OK\n");

		} else if (request.url == '/click') {
			state = 'down';
			events.emit('pushed');
			response.end("OK\n");
			setTimeout(function() {
				state = 'up';
				events.emit('released');
			}, 500);

		} else {
			response.end("URL not understood\n");
		}
	});

	var portNum = '90' + pinNum;
	server.listen(portNum);
	console.log('Button ' + pinNum + ' HTTP server listening on http://localhost:' + portNum);

	return {
		events: function() { return events; },
		state: function() { return state; }
	}
};