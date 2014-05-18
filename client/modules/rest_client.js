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
 * @param winston Winston log module
 */
module.exports = function(conf, schedule, votes, winston) {

	/** Base url of the server */
	var base_url = "http://server:3000";

	/** does the module checks server every minutes */
	var running = false;

	/** Start module watching from server */
	var start = function() {
		running = true;
		winston.info("Starting rest_client module");
		loadStatus();
	};

	/** Stop module watching from server */
	var stop = function() {
		running = false;
		winston.info("Stopping rest_client module");
	};

	/** Load status, upload vote if needed, grab schedule if needed */
	function loadStatus() {
		var url = base_url + '/status/' + conf.idBox;
		winston.debug("Trying to retrieve status on [" + url + "]");

		restler.get(url, { timeout: 3000 })
			.on('fail', function(data, response) {
				winston.error("fail on decoding status data:" + data);
			}).on('error', function (err, response) {
				winston.error("error when retrieving status", err);
			}).on('timeout', function(ms) {
				winston.error("timeout when retrieving status after " + ms);
			}).on('success', function(data, response) {
				winston.debug("Successfully retrieved status");
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
				.on('error', function (err, response) {
					winston.error("error when posting votes", err);
				}).on('timeout', function(ms) {
					winston.error("timeout when posting votes after " + ms);
				}).on('success', function(data, response) {
					winston.info("Successfully sending votes");
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
				winston.error("fail on decoding schedule data: " + data);
			}).on('error', function (err, response) {
				winston.error("error when retrieving schedule", err);
			}).on('timeout', function(ms) {
				winston.error("timeout when retrieving schedule after " + ms);
			}).on('success', function(data, response) {
				winston.debug("Scheduled received");

				schedule.update(response.raw).then(function() {
					winston.info("Schedule successfully updated");
					conf.scheduleModifTime = modifTimestamp;
					return conf.save();
				}).fail(function(err) {
					winston.error("Can't update schedule", err);
				});
			});
	}

	return {
		start: start,
		stop: stop
	}
};