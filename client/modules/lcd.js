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

	//init accents
	lcd .createChar(0, [ 130,132,142,145,159,144,142,128 ]) //é
		.createChar(1, [ 136,132,142,145,159,144,142,128 ]) //è
		.createChar(2, [ 132,138,142,145,159,144,142,128 ]) //ê
		.createChar(3, [ 136,134,128,142,145,147,141,128 ]) //à
		.createChar(4, [ 132,138,128,142,145,147,141,128 ]) //â
		.createChar(5, [ 132,138,128,140,132,132,142,128 ]) //î
		.createChar(6, [ 132,138,128,145,145,147,141,128 ]) //û
		.createChar(7, [ 136,134,128,145,145,147,141,128 ]) //ù
		;

	function replaceAccent(str) {
		var chars = ['é', 'è', 'ê', 'à', 'â', 'î', 'û', 'ù'];
		for (var i = 0; i < chars.length; i++) {
			var char = chars[i];
			str = str.replace(RegExp(char,"g"), String.fromCharCode(i));
		}
		return str;
	}

	/**
	 * Move the cursor to the selected position
	 * @param x horizontal position, starts at 0
	 * @param y vertical position, start at 0
	 */
	var goto = function(x, y) {
		lcd.setCursor(x, y);
		curX = x;
		curY = y;
		return this;
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
			lcd.print(replaceAccent(printStr));
			goto(0, curY + 1);
		}

		//at this point, the string has the correct length to be print in the space left
		//or on the last line
		lcd.print(replaceAccent(maxStr.substr(0, nbCols - curX)));

		goto(xOrig, yOrig);
		return this;
	};

	/** Empty the LCD screen */
	var clear = function() {
		lcd.clear();
		return this;
	};

	return {
		goto: goto,
		print: print,
		clear: clear
	}
};
