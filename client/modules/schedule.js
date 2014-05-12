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
		 * Retrieve the current voting session from the schedule file
		 * @param room Name of the room to get the current voting session
		 * @returns {promise|Q.promise} Param will be the current voting session or undefined:
		 * 		{ id: numeric, title: String, endVote: date }
		 */
		getCurrentSession: function(room) {
			var deferred = Q.defer();
			fs.readFile(scheduleFile, 'utf8', function (err, data) {
				if (err) {
					deferred.reject(new Error(err));
					return;
				}

				var schedule = JSON.parse(data);
				var now = moment('2014-05-22 10:36:27');

				//1 - we need to find the current track and the next one to compute the voting end date
				var current, next, nextArr = [], curDate;
				var days = schedule.programme.jours;
				for (var i = 0 ; i < days.length ; i++) {
					var date = days[i].date; //ex: 21/05/2014
					var day = moment(date, "DD/MM/YYYY");
					if (!day.isSame(now, 'day')) {
						continue;
					}

					//we're on the good day, let's find the right proposal
					curDate = date;
					var tracks = days[i].tracks;
					for (var j = 0 ; j < tracks.length ; j++) {
						var proposals = tracks[j].proposals;

						for (var k = 0 ; k < proposals.length ; k++) {
							var proposal = proposals[k];
							if (proposal.room != room) {
								continue;
							}

							//we're on the right room, let's check the time
							var start = moment(date + ' ' + proposal.start, 'DD/MM/YYYY HH:mm:ss'),
								end = moment(date + ' ' + proposal.end, 'DD/MM/YYYY HH:mm:ss');

							if (start.isBefore(now) && end.isAfter(now)) {
								//we found the current proposal
								current = proposal;
								current.startDate = start;
								current.endDate = end;

							} else if (start.isAfter(now)) {
								//could be a next proposal
								nextArr.push(proposal);
							}
						}
					}

					break;
				}

				//if we don't hit any current session, we return nothing
				if (!current) {
					deferred.resolve();
					return;
				}

				//2 - for each possible next proposal, keep the one with the min start date
				if (nextArr.length > 0) {
					var minI, minDate;
					for (i = 0 ; i < nextArr.length ; i++) {
						proposal = nextArr[i];
						start = moment(date + ' ' + proposal.start, 'DD/MM/YYYY HH:mm:ss');

						if (!minDate || start.isBefore(minDate)) {
							minI = i;
							minDate = start;
						}
					}
					next = nextArr[minI];
				}

				//3 - we have current and next, we can compute the vote end date
				//number of minutes after we close the vote for a session
				var closeAfterSession = 45;
				//if the next session starts 45 min before the end of the current session
				if (minDate && minDate.isBefore(moment(current.endDate).add('minutes', 45))) {
					switch (next.format) {
						case 'conference': closeAfterSession = 30; break;
						case 'tools in action': closeAfterSession = 15; break;
						case 'quickie': closeAfterSession = 10; break;
					}
				}
				var res = {
					id: current.id,
					title: current.title,
					endVote: moment(current.endDate).add('minutes', closeAfterSession).toDate()
				};

				deferred.resolve(res);
			});

			return deferred.promise;
		}

	}
};