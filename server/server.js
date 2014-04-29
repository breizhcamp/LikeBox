var express = require('express');
var app = express();
app.use(express.json());

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(__dirname + '/server_votes.db');

app.get('/', function(req, res) {
	res.send('It works');
});

app.get('/Program', function(req, res) {
        res.download(__dirname + '/schedule.json');
});

app.post('/Vote/:idsession', function(req, res) {
        var stmt = db.prepare("INSERT INTO votes ('sessionId', 'vote', 'timeStamp') values ($session, $vote, datetime('now'))");
        var session = req.params.idsession;
	console.log(req.body);
        stmt.run({$session : session, $vote : req.body.valeur});
        console.log('Vote pour la session ' + session + ' : ' + req.body.valeur);
        res.send("ok");
});

app.listen(3000, function() {
	console.log('Listening on port 3000');
});
