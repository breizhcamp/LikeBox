var express = require('express');
var app = express();

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(__dirname + '/votes.db');
//var db = new sqlite3.Database(':memory:');
var i = 0;

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
    console.log('Acces racine');
});

app.get('/text', function(req, res) {
    db.get("SELECT sum(vote) as total, count(vote) as nbvote FROM votes WHERE sessionId='1'", function (error, row) { 
	var sessiontext = 'Developper en Java et en caleçon';
	var sessiontextdisp = sessiontext.concat('---');
	var progressbar = ':( |------------| :)';
	var total = row.total; 
	var votes = row.nbvote; 
	var curseur = Math.round(total*12/votes);
	console.log(row);
    	res.setHeader('Content-Type', 'text/plain');
    	res.end(sessiontextdisp.substr(i,20) + sessiontextdisp.substr(0,i-sessiontextdisp.length+20) + '<BR/>&nbsp;12h30&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;13h30&nbsp;<BR/>Temps vote : -12min<BR/>' + setCharAt(progressbar,curseur+4,'*'));
	if (i == sessiontextdisp.length) { i = 0; } else { i = i+1; };
    	console.log('Acces text ' + i);
	}
    );
});

app.get('/vote/:valeur', function(req, res) {
    var stmt = db.prepare("INSERT INTO votes ('sessionId', 'vote', 'timeStamp') values ($session, $vote, datetime('now'))");
    session='1';
    stmt.run({$session : session, $vote : req.params.valeur});
    console.log('Vote pour la session' + session + ' : ' + req.params.valeur);
});

app.listen(8088);
console.log('Server running on 8088 port');

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}
