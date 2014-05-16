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

app.get('/status/:idboitier', function(req, res) {
	var boitier = req.params.idboitier;
	var fs = require('fs');
	var stats = fs.statSync(__dirname + '/schedule.json');
	var schedule_mtime = stats.mtime.getTime();
        db.get("SELECT max(timestamp) as last_timestamp, count(id) as nb_votes FROM votes WHERE boitierId='" + boitier + "'", function (error, row) {
        	console.log('Dernier timestamp pour le boitier : ' + boitier + ' => ' + row.last_timestamp);
        	res.send("{'timestamp':'" + row.last_timestamp + "', 'nb_votes':'" + row.nb_votes + "', 'schedule_mtime':'" + schedule_mtime + "'}");
	});
});

app.post('/vote/:idboitier', function(req, res) {
  for (var voteid in req.body.votes) {
        var boitier = req.params.idboitier;
        var stmt = db.prepare("INSERT INTO votes ('sessionId', 'vote', 'timeStamp', 'boitierId') values ($session, $vote, $timestamp, $boitierId)");
        stmt.run({$session : req.body.votes[voteid].sessionId, $vote : req.body.votes[voteid].vote, $timestamp : req.body.votes[voteid].timestamp, $boitierId : boitier});
        console.log('Vote sur le boitier ' + boitier + 'pour la session ' + req.body.votes[voteid].sessionId + ' : ' + req.body.votes[voteid].valeur);
      }
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
