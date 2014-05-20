var express = require('express'),
	fs = require('fs'),
	http = require('http'),
	jsonPath = require('JSONPath'),
	sqlite3 = require('sqlite3').verbose();

// -- INIT --
var app = express();
app.use(express.json());

var db = new sqlite3.Database(__dirname + '/server_votes.db', function(err) {
	if (err) {
		console.log(err);
		return;
	}

	//create table if not existing
	db.run("CREATE TABLE IF NOT EXISTS votes " +
		"(id integer primary key AUTOINCREMENT, sessionId integer, vote integer, timeStamp date, boitierId integer)", function(err) {

		if (err) {
			console.log(err);
		}
	});
});

console.log("Downloading schedule");
var programJSON = null;
http.get('http://www.breizhcamp.org/json/schedule.json', function(res) {
    var body = '';

    res.on('data', function(chunk) {
        body += chunk;
    });

    res.on('end', function() {
		console.log("Schedule downloaded");
        programJSON = JSON.parse(body);
		fs.writeFileSync(__dirname + '/schedule.json', body);
    });

}).on('error', function(e) {
	console.log("Got error when downloading schedule, using local version: ", e);
	programJSON = JSON.parse(fs.readFileSync(__dirname + '/schedule.json'));

}).setTimeout(10000, function() {
	console.log("Got timeout when downloading schedule, using local version");
	programJSON = JSON.parse(fs.readFileSync(__dirname + '/schedule.json'));
});

// -- MAPPING URL --
var auth = express.basicAuth('bzhcamp', 'CHANGEME');

app.use(express.static(__dirname + '/static'));

app.get('/program', function(req, res) {
    res.download(__dirname + '/schedule.json');
});

app.get('/status/:idboitier', auth, function(req, res) {
	var boitier = req.params.idboitier;
	var stats = fs.statSync(__dirname + '/schedule.json');
	var schedule_mtime = stats.mtime.getTime();
	db.get("SELECT max(timestamp) as last_timestamp FROM votes WHERE boitierId='" + boitier + "'", function (error, row) {
		console.log('Dernier timestamp pour le boitier : ' + boitier + ' => ' + row.last_timestamp);
		res.json({
			timestamp: row.last_timestamp,
			schedule_mtime: schedule_mtime
		});
	});
});

app.post('/vote/:idboitier', auth, function(req, res) {
	var boitier = req.params.idboitier;
	var votes = req.body.votes;

	for (var i = 0; i < votes.length; i++) {
		var vote = votes[i];

		var stmt = db.prepare("INSERT INTO votes ('sessionId', 'vote', 'timeStamp', 'boitierId') " +
				"values ($session, $vote, $timestamp, $boitierId)");

		stmt.run({
			$session : vote.session,
			$vote : vote.vote,
			$timestamp : vote.timestamp,
			$boitierId : boitier
		});

		console.log('Vote sur le boitier ' + boitier + ':', vote);
	}
	res.send("ok");
});

app.get('/top/:nb', function(req, res) {

	var nombre = req.params.nb;
	var results = {};
	var row_num = 1;
	db.each("SELECT sessionId, sum(vote) as somme, count(vote) as nb_votes " +
		"from votes group by sessionId order by somme desc limit " + nombre , function (error, row) {

		cur_sess = row_num;
		results[cur_sess] = row;
		var conf = jsonPath.eval(programJSON, "$..proposals[?(@.id=='" + row.sessionId + "')]");
		if (conf == null || conf.length === 0) {
			results[cur_sess].titre = "Not Found";
		}
		else {
			results[cur_sess].titre = conf[0].title;
		}
		row_num += 1;

	}, function () {
		res.send(results);
	});
});

app.listen(3000, function() {
	console.log('Listening on port 3000');
});
