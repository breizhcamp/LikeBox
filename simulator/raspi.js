var express = require('express');
var app = express();

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(__dirname + '/votes.db');
//var db = new sqlite3.Database(':memory:');

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
    console.log('Acces racine');
});

app.get('/text', function(req, res) {
    db.get("SELECT sum(vote) as total, count(vote) as nbvote FROM votes WHERE sessionId='1'", function (error, row) { 
	var total = row.total; 
	var votes = row.nbvote; 
	console.log(row);
    	res.setHeader('Content-Type', 'text/plain');
    	res.end('Developer en Java et en caleçon<BR/>Valeur du vote : ' + total + ' sur nb votes : ' + votes);
    	console.log('Acces text');
	}
    );
});

app.get('/vote/:valeur', function(req, res) {
    var stmt = db.prepare("INSERT INTO votes ('sessionId', 'vote', 'timeStamp') values ($session, $vote, datetime('now'))");
    session='1';
    stmt.run({$session : session, $vote : req.params.valeur});
    console.log('Vote pour la session' + session + ' : ' + req.params.valeur);
});

app.listen(8080);
console.log('Server running on 8080 port');
