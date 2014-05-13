var ansi = require('ansi'),
	net = require('net'),
	eventEmitter = require('events').EventEmitter;

/**
 * Virtual module to simulate the LCD screen on a socket.
 * Connect with netcat to the simulator screen : nc localhost 9127
 * The port number is based on address parameter.
 * @param i2cDev not used
 * @param address Socket port number 91address
 * @param nbLines Number of lines of the virtual screen
 * @param nbCols Number of columns of the virtual screen
 */
module.exports = function(i2cDev, address, nbLines, nbCols) {
	var curX = 0, curY = 0;
	//we use an event emitter to send data to all connected clients
	var events = new eventEmitter();

	var server = net.createServer(function(socket) {
		var cursor = ansi(socket, { enabled: true });
		cursor.goto(1,1).eraseData();

		events.on('goto', function(data) {
			cursor.goto(data.x + 1, data.y + 1); //adding one as cursor start at 0
		});

		events.on('print', function(data) {
			var maxStr = data.str,
				xOrig = data.x,
				yOrig = data.y;

			while (maxStr.length > (nbCols - data.x) && (data.y < nbLines - 1)) {
				var maxLength = (nbCols - data.x),
					printStr = maxStr.substr(0, maxLength);
				maxStr = maxStr.substr(maxLength);

				//console.log("write [" + printStr + "] at pos [" + data.x + "," + data.y + "]");
				cursor.write(printStr);
				data.x = 0;
				data.y++;
				cursor.goto(data.x + 1, data.y + 1);
			}

			//at this point, the string has the correct length to be print in the space left
			//or on the last line
			//console.log("write [" + maxStr + "] at pos [" + data.x + "," + data.y + "]");
			cursor.write(maxStr.substr(0, nbCols - data.x)).goto(xOrig + 1, yOrig + 1);
		})
	});

	/**
	 * Move the cursor to the selected position
	 * @param x horizontal position, starts at 0
	 * @param y vertical position, start at 0
	 */
	var goto = function(x, y) {
		events.emit('goto', { x: x, y: y });
		curX = x;
		curY = y;
	};

	/**
	 * Print a string on the screen at the current location.
	 * If the string is too large for the screen, the string is cut and go to the next line.
	 * The cursor is reset to the initial location after the print.
	 * @param str String to print
	 */
	var print = function(str) {
		events.emit('print', { str: str, x: curX, y: curY });
	};

	var port = 9100 + address;
	server.listen(port);
	console.log('Virtual screen server listening on port ' + port);

	return {
		goto: goto,
		print: print
	}
};