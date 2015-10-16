var fs = require('fs'),
	moment = require('moment'),
	Q = require('q');

/**
 * Read the schedule file and extract rooms names and current voting talk.
 * @param scheduleFile Schedule file to read
 */
module.exports = function(scheduleFile) {
	return {

		/**
		 * Retrieve the current voting session from the schedule file. The voting starts 10 minutes
		 * after the beginning of the session and ends 15 minutes after the session ends.
		 * @param room Name of the room to get the current voting session
		 * @returns {promise|Q.promise} Param will be the current voting session or undefined:
		 * 		{ id: numeric, title: String, endVote: date }
		 */
		getCurrentSession: function(room) {
			//number of minutes after which the vote starts and ends
			var startDelay = 10,
				endDelay = 15;

			var deferred = Q.defer();
			fs.readFile(scheduleFile, 'utf8', function (err, data) {
				if (err) {
					deferred.reject(new Error(err));
					return;
				}

				var schedule = JSON.parse(data);
				var now = moment();
				var current;

				for (var k = 0 ; k < schedule.length ; k++) {
					var event = schedule[k];
					if (event.venue_id != room) {
						continue;
					}

					var start = moment(event.event_start, 'YYYY-MM-DD HH:mm:ss')
							.add(startDelay, 'minutes'),
						end = moment(event.event_end, 'YYYY-MM-DD HH:mm:ss')
							.add(endDelay, 'minutes');

					if (start.isBefore(now) && end.isAfter(now)) {
						//we found the current event
						current = event;
						current.endDate = end;
						break;
					}
				}

				//if we don't hit any current session, we return nothing
				if (!current) {
					deferred.resolve();
					return;
				}

				//building result
				var res = {
					id: current.id,
					title: current.title,
					endVote: current.endDate.toDate()
				};

				deferred.resolve(res);
			});

			return deferred.promise;
		},

		/**
		 * update new schedule and replace the old one
		 * @param newSchedule String new schedule file
		 * @returns {promise|Q.promise} Promise resolved when new schedule updated
		 */
		update: function(newSchedule) {
			var deferred = Q.defer();

			fs.writeFile(scheduleFile + '.part', newSchedule, function(err) {
				if (err) {
					deferred.reject(new Error(err));
				} else {
					//moving part file to old one
					fs.rename(scheduleFile + '.part', scheduleFile, function(err) {
						if (err) {
							deferred.reject(new Error(err));
						} else {
							deferred.resolve();
						}
					});
				}
			});

			return deferred.promise;
		}

	}
};