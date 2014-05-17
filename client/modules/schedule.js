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
		 * Returns all rooms names from the schedule.
		 * @returns {promise|Q.promise} Param will contains an array with rooms name
		 */
		getRooms: function() {
			var deferred = Q.defer();
			fs.readFile(scheduleFile, 'utf8', function (err, data) {
				if (err) {
					deferred.reject(new Error(err));
					return;
				}
				var schedule = JSON.parse(data);
				var rooms = {};

				var days = schedule.programme.jours;
				for (var i = 0 ; i < days.length ; i++) {
					var tracks = days[i].tracks;

					for (var j = 0 ; j < tracks.length ; j++) {
						var proposals = tracks[j].proposals;

						for (var k = 0 ; k < proposals.length ; k++) {
							var room = proposals[k].room;
							if (room.trim().length > 0) {
								rooms[room] = room;
							}
						}
					}
				}

				//build the final array
				var res = [];
				Object.keys(rooms).forEach(function(key) {
					res.push(key);
				});
				deferred.resolve(res);
			});
			return deferred.promise;
		},

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

				//let's find the current day in schedule file
				var current;
				var days = schedule.programme.jours;
				for (var i = 0 ; i < days.length ; i++) {
					var date = days[i].date; //ex: 21/05/2014
					var day = moment(date, "DD/MM/YYYY");
					if (!day.isSame(now, 'day')) {
						continue;
					}

					//we're on the good day, let's find the right proposal
					var tracks = days[i].tracks;
					for (var j = 0 ; j < tracks.length ; j++) {
						var proposals = tracks[j].proposals;

						for (var k = 0 ; k < proposals.length ; k++) {
							var proposal = proposals[k];
							if (proposal.room != room) {
								continue;
							}

							//we're on the right room, let's check the start and end+delay
							var start = moment(date + ' ' + proposal.start, 'DD/MM/YYYY HH:mm:ss')
									.add('minutes', startDelay),
								end = moment(date + ' ' + proposal.end, 'DD/MM/YYYY HH:mm:ss')
										.add('minutes', endDelay);

							if (start.isBefore(now) && end.isAfter(now)) {
								//we found the current proposal
								current = proposal;
								current.endDate = end;

							}
						}
					}

					//on the right day, exit loop
					break;
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
		}

	}
};