var sqlite3 = require('sqlite3').verbose();

/**
 * Module to handle votes count
 */
module.exports = function() {
	var db;

	/**
	 * Starts vote module.
	 * @param cb Function to call when the vote module is ready
	 */
	var start = function(cb) {
		db = new sqlite3.Database('votes.db', function(err) {
			if (err) throw err;

			//create table if not existing
			db.run("CREATE TABLE IF NOT EXISTS votes " +
				"(id INTEGER PRIMARY KEY, timestamp INTEGER, session INTEGER, vote TEXT)",
			function(err) {
				if (err) throw err;
				cb();
			});
		});
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
	 * @param cb Function called with votes list ({timestamp: number, session: number, vote: string})
	 */
	var listVotes = function(fromTimestamp, cb) {
		if (!db) throw "Vote module not started";
		db.all("SELECT timestamp, session, vote FROM votes WHERE timestamp > ?", fromTimestamp, function(err, rows) {
			if (err) throw err;
			cb(rows);
		});
	};

	/**
	 * Get the count of votes for a specific session.
	 * @param sessionId Id of the session to get the votes
	 * @param cb Callback called with : {m: number, p: number} 'm' for minus count, 'p' for plus count
	 */
	var getCount = function(sessionId, cb) {
		if (!db) throw "Vote module not started";
		db.all("SELECT COUNT(*) as nb, vote FROM votes GROUP BY vote", function(err, rows) {
			if (err) throw err;

			var res = { p: 0, m:0 };
			for (var i = 0 ; i < rows.length ; i++) {
				var row = rows[i];
				if (row.vote == 'p') res.p = row.nb;
				else if (row.vote == 'm') res.m = row.nb;
			}

			cb(res);
		});
	};

	/**
	 * Stops the vote module.
	 * @param cb Function to call when the vote module is stopped
	 */
	var stop = function(cb) {
		if (!db) throw "Vote module not started";
		db.close(function(err) {
			if (err) throw err;
			cb();
		});
	};

	return {
		start: start,
		addVote: addVote,
		listVotes: listVotes,
		getCount: getCount,
		stop: stop
	}
};