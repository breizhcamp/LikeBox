var restler = require('restler');

/**
 * Module handling communication with the server : getting server status, uploading vote
 * and updating schedule if modified.
 *
 * Every minute, the module tries to connect to the server to received the last recorded vote timestamp
 * and the last modified schedule timestamp.
 * Then, if there's new vote, the client upload it.
 * If the schedule is also modified, the client download it and save it locally.
 *
 * @param conf Conf module
 * @param schedule Schedule module
 * @param votes Vote module
 */
module.exports = function(conf, schedule, votes) {

	/** Base url of the server */
	var base_url = "http://server:3000";

	/** does the module checks server every minutes */
	var running = false;

	/** Start module watching from server */
	var start = function() {
		running = true;
		loadStatus();
	};

	/** Stop module watching from server */
	var stop = function() {
		running = false;
	};

	/** Load status, upload vote if needed, grab schedule if needed */
	function loadStatus() {
		restler.get(base_url + '/status/' + conf.idBox, { timeout: 3000 })
			.on('fail', function(data, response) {
				console.log("fail on data: " + data);
			}).on('error', function (err, response) {
				console.log("error", err);
			}).on('timeout', function(ms) {
				console.log("timeout after " + ms);
			}).on('success', function(data, response) {
				sendVotes(data.timestamp);
				getSchedule(data.schedule_mtime);
			});

		if (running) {
			setTimeout(loadStatus, 60000);
		}
	}

	/**
	 * Send all the vote done after lastTimestamp
	 * @param lastTimestamp vote after this timestamp will be send to the server
	 */
	function sendVotes(lastTimestamp) {
		if (!lastTimestamp) lastTimestamp = 0;

		votes.listVotes(lastTimestamp).then(function(votesList) {
			if (votesList && votesList.length == 0) { return; }

			var data = { votes: votesList };

			restler.postJson(base_url + '/vote/' + conf.idBox, data, { timeout: 3000 })
				.on('fail', function(data, response) {
					console.log("fail on data: " + data);
				}).on('error', function (err, response) {
					console.log("error", err);
				}).on('timeout', function(ms) {
					console.log("timeout after " + ms);
				}).on('success', function(data, response) {
					console.log(data);
				});

		});
	}

	/**
	 * Retrieve the schedule from the server if needed
	 * @param modifTimestamp timestamp of the last modification of the schedule on the server
	 */
	function getSchedule(modifTimestamp) {
		if (conf.scheduleModifTime && conf.scheduleModifTime == modifTimestamp) {
			//schedule not modified
			return;
		}

		restler.get(base_url + '/program', { timeout: 3000 })
			.on('fail', function(data, response) {
				console.log("fail on data: " + data);
			}).on('error', function (err, response) {
				console.log("error", err);
			}).on('timeout', function(ms) {
				console.log("timeout after " + ms);
			}).on('success', function(data, response) {
				schedule.update(response.raw).then(function() {
					conf.scheduleModifTime = modifTimestamp;
					return conf.save();
				}).fail(console.log);
			});
	}

	return {
		start: start,
		stop: stop
	}
};