var fs = require('fs'),
	Q = require('q');

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
		var deferred = Q.defer();
		var res = {};

		for (var key in conf) {
			if (conf.hasOwnProperty(key)) {
				var val = conf[key];

				switch (typeof val) {
					case "string":
					case "number":
					case "boolean":
						res[key] = val;
				}
			}
		}

		//async file and resolve promise
		fs.writeFile(file, JSON.stringify(res), function(err) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve();
			}
		});

		return deferred.promise;
	};

	return conf;
};