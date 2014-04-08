var express = require('express');
var app = express();
app.use(express.urlencoded());

var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(__dirname + '/votes.db');

var jsonPath = require('JSONPath');

var i = 0;

var jourCourant = '13/06/2013';
var heureCourante = '9:45';
var salleCourante = 'Groix';

var programJSON = require(__dirname + '/breizhcamp.json');

var confsJour = jsonPath.eval(programJSON, "$..jours[?(@.date=='" + jourCourant + "')]");
var confsJourSalle = jsonPath.eval(confsJour, "$..proposals[?(@.room=='" + salleCourante + "')]");
for (var conf in confsJourSalle) {
	var debut = confsJourSalle[conf].time.split(':');
	confsJourSalle[conf].start = parseInt(debut[0]*60)+parseInt(debut[1]);
	switch (confsJourSalle[conf].format) {
	case 'quickie' : 
		confsJourSalle[conf].stop = parseInt(confsJourSalle[conf].start) + 40;
		confsJourSalle[conf].finvote = parseInt(confsJourSalle[conf].stop) + 10;
	case 'tools in action' : 
		confsJourSalle[conf].stop = parseInt(confsJourSalle[conf].start) + 25;
		confsJourSalle[conf].finvote = parseInt(confsJourSalle[conf].stop) + 15;
	case 'hands-on' : 
		confsJourSalle[conf].stop = parseInt(confsJourSalle[conf].start) + 115;
		confsJourSalle[conf].finvote = parseInt(confsJourSalle[conf].stop) + 45;
	case 'conference' : 
		confsJourSalle[conf].stop = parseInt(confsJourSalle[conf].start) + 55;
		confsJourSalle[conf].finvote = parseInt(confsJourSalle[conf].stop) + 30;
	case 'lab' : 
		confsJourSalle[conf].stop = parseInt(confsJourSalle[conf].start) + 85;
		confsJourSalle[conf].finvote = parseInt(confsJourSalle[conf].stop) + 30;
	case 'biglab' : 
		confsJourSalle[conf].stop = parseInt(confsJourSalle[conf].start) + 115;
		confsJourSalle[conf].finvote = parseInt(confsJourSalle[conf].stop) + 45;
	case 'universite' : 
		confsJourSalle[conf].stop = parseInt(confsJourSalle[conf].start) + 180;
		confsJourSalle[conf].finvote = parseInt(confsJourSalle[conf].stop) + 90;
	}
} 

var heureCourante = 600;
var confCourante = jsonPath.eval(confsJourSalle, "$[?(@.start<'" + heureCourante + "'&&@.stop>'" + heureCourante + "')]");
var sessiontext=confCourante[0].title;

app.get('/', function(req, res) {
    res.sendfile(__dirname + '/index.html');
    console.log('Acces racine');
});

app.get('/text', function(req, res) {
    db.get("SELECT sum(vote) as total, count(vote) as nbvote FROM votes WHERE sessionId='1'", function (error, row) { 
	//var sessiontext = 'Developper en Java et en caleçon';
	var sessiontextdisp = sessiontext.concat('---');
	var progressbar = ':( |------------| :)';
	var total = row.total; 
	var votes = row.nbvote; 
	var curseur = Math.round(total*12/votes);
	console.log(row);
	console.log(parseInt(confCourante[0].finvote));
    	res.setHeader('Content-Type', 'text/plain');
    	res.end(sessiontextdisp.substr(i,20) + sessiontextdisp.substr(0,i-sessiontextdisp.length+20) + '<BR/>&nbsp;' + Math.floor(parseInt(confCourante[0].start)/60) + 'h' + deuxchiffres(parseInt(confCourante[0].start) % 60)  + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + Math.floor(parseInt(confCourante[0].stop)/60) + 'h' + deuxchiffres(parseInt(confCourante[0].stop) % 60) + '&nbsp;<BR/>Temps vote : ' + (parseInt(confCourante[0].finvote) - parseInt(heureCourante))  + 'min<BR/>' + setCharAt(progressbar,curseur+4,'*'));
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

app.post('/settime', function(req, res) {
	console.log("Set time : ");
	console.log(req.body);
	res.send("ok");
});

app.post('/setsalle', function(req, res) {
	console.log("Set Salle : ");
	console.log(req.body);
	res.send("ok");
});

app.listen(8088);
console.log('Server running on 8088 port');

function setCharAt(str,index,chr) {
    if(index > str.length-1) return str;
    return str.substr(0,index) + chr + str.substr(index+1);
}

function deuxchiffres(n){
    return n > 9 ? "" + n: "0" + n;
}
