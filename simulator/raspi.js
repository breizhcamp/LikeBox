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
var sessionNum = '999'; 

app.get('/', function(req, res) {
    	res.sendfile(__dirname + '/index.html');
});

app.get('/sessionId', function(req, res) {
	res.setHeader('Content-Type', 'text/plain');
	res.end(sessionNum.toString());
});

app.get('/text', function(req, res) {

	console.log('Jour : ' + jourCourant + ', Heure : ' + heureCourante + ', Salle : ' + salleCourante);

	// Récupération des sessions depuis le programme json
	var programJSON = require(__dirname + '/breizhcamp.json');

	// Récupération des confs du jour pour la salle courante
	var confsJour = jsonPath.eval(programJSON, "$..jours[?(@.date=='" + jourCourant + "')]");
	var confsJourSalle = jsonPath.eval(confsJour, "$..proposals[?(@.room=='" + salleCourante + "')]");
	for (var conf in confsJourSalle) {
		var debut = confsJourSalle[conf].time.split(':');
		// Passage des heures de départ en pseudo timestamp 
		confsJourSalle[conf].start = parseInt(debut[0]*60)+parseInt(debut[1]);
		// On ajoute les heures de fin toujours en pseudo timestamp, ainsi que l'heure de fin de vote
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

	// Recherche de la session correspondant à l'heure courante
	var heureCouranteSplit = heureCourante.split(':');
	var heureCouranteNum = parseInt(heureCouranteSplit[0]*60)+parseInt(heureCouranteSplit[1]);
	var confCourante = jsonPath.eval(confsJourSalle, "$[?(@.start<'" + heureCouranteNum + "'&&@.finvote>'" + heureCouranteNum + "')]");

	// Si il n'y a pas de session en cours, on affiche un petit mot...
	if (confCourante.length == 0) { 
		sessionNum = '999';
		res.setHeader('Content-Type', 'text/plain');
		res.end('BreizhCamp<BR/>For<BR/>The<BR/>Win');
	} else {
	// Si on trouve la session, on affiche les informations sur le LCD
		var sessiontext=confCourante[0].title;
		sessionNum=confCourante[0].id;
		// Ligne 1 - Génération de la rotation sur le titre de la session en cours - TODO : c'est ptet un peu buggé...
		var sessiontextdisp = sessiontext.concat('---');
		var rotatingText = sessiontextdisp.substr(i,20) + sessiontextdisp.substr(0,i-sessiontextdisp.length+20);

		// Ligne 2 - Création de la ligne affichant l'heure de début et l'heure de fin
		var heuresConf = Math.floor(parseInt(confCourante[0].start)/60) + 'h' + deuxchiffres(parseInt(confCourante[0].start) % 60)  + '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' + Math.floor(parseInt(confCourante[0].stop)/60) + 'h' + deuxchiffres(parseInt(confCourante[0].stop) % 60);

		// Ligne 3 - Affichage du temps avant la fin des votes
		var tempsFinVote = (parseInt(confCourante[0].finvote)) - parseInt(heureCouranteNum);

		// Récupération des votes pour la session en cours
		db.get("SELECT sum(vote) as total, count(vote) as nbvote FROM votes WHERE sessionId='" + sessionNum + "'", function (error, row) { 
			// Ligne 4 - Affichage du vote sur une barre de progression - TODO : il reste un bug si on fait un vote négatif en premier...
			var progressbar = ':( |------------| :)';
			var total = row.total; 
			var votes = row.nbvote; 
			var curseur = 6;
			if (votes != 0) { curseur = Math.round(total*12/votes); };
			// Positionnement du curseur de vote sur la barre
			var progressbarCurseur = setCharAt(progressbar,curseur+4,'*');

		    	res.setHeader('Content-Type', 'text/plain');
		    	res.end(rotatingText + '<BR/>&nbsp;' + heuresConf + '&nbsp;<BR/>Temps vote : ' + tempsFinVote + 'min<BR/>' + progressbarCurseur);

			// On avance le curseur pour la rotation du titre
			if (i == sessiontextdisp.length) { i = 0; } else { i = i+1; };
		});
	};
});

app.post('/vote', function(req, res) {
    	var stmt = db.prepare("INSERT INTO votes ('sessionId', 'vote', 'timeStamp') values ($session, $vote, datetime('now'))");
    	var session = req.body.session;
    	stmt.run({$session : session, $vote : req.body.valeur});
	console.log('Vote pour la session' + session + ' : ' + req.body.valeur);
	res.send("ok");
});

app.post('/settime', function(req, res) {
	jourCourant=req.body.jour;
	heureCourante= req.body.heure + ':' + req.body.minutes;
	res.send("ok");
});

app.post('/setsalle', function(req, res) {
	salleCourante = req.body.Choix;
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
