var sqlite3 = require('sqlite3').verbose(),
	Q = require('q');

/**
 * Module to handle votes count
 */
module.exports = function() {
	var db;

	/**
	 * Starts vote module.
	 * @returns {promise|Q.promise} Resolve promise when module started
	 */
	var start = function() {
		var deferred = Q.defer();
		db = new sqlite3.Database('votes.db', function(err) {
			if (err) {
				deferred.reject(new Error(err));
				return;
			}

			//create table if not existing
			db.run("CREATE TABLE IF NOT EXISTS votes " +
				"(id INTEGER PRIMARY KEY, timestamp INTEGER, session INTEGER, vote TEXT)",
			function(err) {
				if (err) {
					deferred.reject(new Error(err));
				} else {
					deferred.resolve();
				}
			});
		});
		return deferred.promise;
	};

	/**
	 * Add a vote into the database
	 * @param sessionId Id of the session the user vote to
	 * @param vote Value of the vote : 'p' for plus, 'm' for minus
	 */
	var addVote = function(sessionId, vote) {
		if (!db) throw "Vote module not started";

		var timestamp = Date.now();
		vote = (vote == 'm' ? 'm' : 'p');
		db.run("INSERT INTO votes (timestamp, session, vote) VALUES (?, ?, ?)", timestamp, sessionId, vote);
	};

	/**
	 * Retrieve all votes from a specific time.
	 * @param fromTimestamp Timestamp of the minimal vote to retrieve
	 * @returns {promise|Q.promise} Param will be votes list ({timestamp: number, session: number, vote: string})
	 */
	var listVotes = function(fromTimestamp) {
		if (!db) throw "Vote module not started";
		var deferred = Q.defer();
		db.all("SELECT timestamp, session, vote FROM votes WHERE timestamp > ?", fromTimestamp, function(err, rows) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve(rows);
			}
		});
		return deferred.promise;
	};

	/**
	 * Get the count of votes for a specific session.
	 * @param sessionId Id of the session to get the votes
	 * @returns {promise|Q.promise} Param will be : {m: number, p: number} 'm' for minus count, 'p' for plus count
	 */
	var getCount = function(sessionId) {
		if (!db) throw "Vote module not started";
		var deferred = Q.defer();
		db.all("SELECT COUNT(*) as nb, vote FROM votes WHERE session = ? GROUP BY vote", sessionId, function(err, rows) {
			if (err) {
				deferred.reject(new Error(err));
				return;
			}

			//read count res and put it into a single object
			var res = { p: 0, m:0 };
			for (var i = 0 ; i < rows.length ; i++) {
				var row = rows[i];
				if (row.vote == 'p') res.p = row.nb;
				else if (row.vote == 'm') res.m = row.nb;
			}

			deferred.resolve(res);
		});
		return deferred.promise;
	};

	/**
	 * Stops the vote module.
	 * @returns {promise|Q.promise} Resolved when module stopped
	 */
	var stop = function() {
		if (!db) throw "Vote module not started";
		var deferred = Q.defer();
		db.close(function(err) {
			if (err) {
				deferred.reject(new Error(err));
			} else {
				deferred.resolve();
			}
		});
		return deferred.promise;
	};

	return {
		start: start,
		addVote: addVote,
		listVotes: listVotes,
		getCount: getCount,
		stop: stop
	}
};