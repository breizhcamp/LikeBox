var LCD = require('lcd-pcf8574');

/**
 * Module for displaying onto the lcd screen (4*20 characters)
 * @param i2cDev I2C port (/dev/i2c-0 or /dev/i2c-1 according to Raspi version)
 * @param address I2C address of the module (0x27 for standard lcm1602 module)
 * @param nbLines Number of lines on the screen
 * @param nbCols Number of columns on the screen
 */
module.exports = function(i2cDev, address, nbLines, nbCols) {
	var lcd = new LCD(i2cDev, address);
	var curX = 0, curY = 0;

	/**
	 * Move the cursor to the selected position
	 * @param x horizontal position, starts at 0
	 * @param y vertical position, start at 0
	 */
	var goto = function(x, y) {
		lcd.setCursor(x, y);
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
		var maxStr = str,
			xOrig = curX,
			yOrig = curY;

		while (maxStr.length > (nbCols - curX) && (curY < nbLines - 1)) {
			var maxLength = (nbCols - curX),
				printStr = maxStr.substr(0, maxLength);
			maxStr = maxStr.substr(maxLength);
			lcd.print(printStr);
			goto(0, curY + 1);
		}

		//at this point, the string has the correct length to be print in the space left
		//or on the last line
		lcd.print(maxStr.substr(0, nbCols - curX));

		goto(xOrig, yOrig);
	};

	return {
		goto: goto,
		print: print
	}
};