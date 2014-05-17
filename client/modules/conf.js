var fs = require('fs');

/**
 * Configuration module, read JSON file as param and add into returned module,
 * You can also add config item by adding to the module object.
 * @param file File where to read and save the configuration
 * @returns Module object with configuration properties and save method
 */
module.exports = function(file) {
	var conf = {};

	try {
		var json = fs.readFileSync(file);
		conf = JSON.parse(json);

	} catch (e) {
		//do nothing if we can't read conf file
	}

	/**
	 * Save all properties of the conf object (string, number, boolean) into the conf file
	 */
	conf.save = function() {
		var res = {};

		for (var key in this) {
			if (this.hasOwnProperty(key)) {
				var val = this[key];

				switch (typeof val) {
					case "string":
					case "number":
					case "boolean":
						res[key] = val;
				}
			}
		}

		fs.writeFileSync(file, JSON.stringify(res));
	};

	return conf;
};