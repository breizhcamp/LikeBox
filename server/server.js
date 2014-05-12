var express = require('express');
var app = express();
app.use(express.json());

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(__dirname + '/server_votes.db');

var jsonPath = require('JSONPath');

app.get('/', function(req, res) {
        res.sendfile(__dirname + '/index.html');
});

app.get('/program', function(req, res) {
        res.download(__dirname + '/schedule.json');
});

app.get('/status/:idsession', function(req, res) {
	var session = req.params.idsession;
	var fs = require('fs');
	var stats = fs.statSync(__dirname + '/schedule.json');
	var schedule_mtime = stats.mtime.getTime();
        db.get("SELECT max(timestamp) as last_timestamp, count(id) as nb_votes FROM votes WHERE sessionId='" + session + "'", function (error, row) {
        	console.log('Dernier timestamp pour la session : ' + session + ' => ' + row.last_timestamp);
        	res.send("{'timestamp':'" + row.last_timestamp + "', 'nb_votes':'" + row.nb_votes + "', 'schedule_mtime':'" + schedule_mtime + "'}");
	});
});

app.post('/vote/:idsession', function(req, res) {
        var stmt = db.prepare("INSERT INTO votes ('sessionId', 'vote', 'timeStamp') values ($session, $vote, $timestamp)");
        var session = req.params.idsession;
        stmt.run({$session : session, $vote : req.body.valeur, $timestamp : req.body.timestamp});
        console.log('Vote pour la session ' + session + ' : ' + req.body.valeur);
        res.send("ok");
});

app.get('/top/:nb', function(req, res) {
	var nombre = req.params.nb;
	var results = {};
	var programJSON = require(__dirname + '/schedule.json');
	var row_num = 1;
        db.each("SELECT sessionId, sum(vote) as somme, count(vote) as nb_votes from votes group by sessionId order by somme desc limit " + nombre , function (error, row) {
		cur_sess=row_num;
		results[cur_sess] = row;
		var conf = jsonPath.eval(programJSON, "$..proposals[?(@.id=='" + row.sessionId + "')]");
		results[cur_sess].titre = conf[0].title;
		row_num += 1;
	}, function () { res.send(results) })
});

app.listen(3000, function() {
	console.log('Listening on port 3000');
});
