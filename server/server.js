var restify = require('restify'),
	fs = require('fs'),
	http = require('http'),
	winston = require('winston'),
	moment = require('moment'),
	sqlite3 = require('sqlite3').verbose();

// -- INIT --
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { timestamp: true });

var server = restify.createServer();
server.use(restify.bodyParser());
server.use(restify.authorizationParser());

var db = new sqlite3.Database(__dirname + '/server_votes.db', function(err) {
	if (err) {
		winston.error(err);
		return;
	}

	//create table if not existing
	db.run("CREATE TABLE IF NOT EXISTS votes " +
		"(id integer primary key AUTOINCREMENT, sessionId integer, vote integer, timeStamp date, boitierId integer)", function(err) {

		if (err) {
			winston.error(err);
		}
	});
});

winston.info("Downloading schedule");
var programJSON = null;
http.get('http://www.breizhcamp.org/json/schedule.json', function(res) {
    var body = '';

    res.on('data', function(chunk) {
        body += chunk;
    });

    res.on('end', function() {
		winston.info("Schedule downloaded");
        programJSON = JSON.parse(body);
		fs.writeFileSync(__dirname + '/schedule.json', body);
		cacheTitle();
    });

}).on('error', function(e) {
	winston.error("Got error when downloading schedule, using local version: ", e);
	programJSON = JSON.parse(fs.readFileSync(__dirname + '/schedule.json'));
	cacheTitle();

}).setTimeout(10000, function() {
	winston.error("Got timeout when downloading schedule, using local version");
	programJSON = JSON.parse(fs.readFileSync(__dirname + '/schedule.json'));
	cacheTitle();
});

var proposalsMap = {};
function cacheTitle() {
	// map proposal cache
	var days = programJSON.programme.jours;
	for (var i = 0 ; i < days.length ; i++) {
		var proposals = days[i].proposals;

		for (var k = 0 ; k < proposals.length ; k++) {
			var id = proposals[k].id;
			proposalsMap[id] = proposals[k].title;
		}
	}
}

// -- USER/PASS --
server.use(function (req, res, next) {
	var auth = req.authorization;

	if (auth && auth.scheme == "Basic"
			&& auth.basic.username == 'bzhcamp' && auth.basic.password == 'CHANGEME') {
		return next();
	}

	res.header('WWW-Authenticate', 'Basic realm="LikeBox"');
	return next(new restify.UnauthorizedError("Invalid username or password"));
});

// -- MAPPING URL --
server.get('/program', function(req, res, next) {
	fs.readFile(__dirname + '/schedule.json', function (err, data) {
		if (err) {
			next(err);
			return;
		}

		res.setHeader('Content-Type', 'application/json');
		res.writeHead(200);
		res.end(data);
		next();
	});
});

server.get('/status/:idboitier', function(req, res, next) {
	var boitier = req.params.idboitier;
	var stats = fs.statSync(__dirname + '/schedule.json');
	var schedule_mtime = stats.mtime.getTime();
	db.get("SELECT max(timestamp) as last_timestamp FROM votes WHERE boitierId='" + boitier + "'", function (error, row) {
		var lasttime = row.last_timestamp;
		winston.info('[' + req.connection.remoteAddress + '] ' +
			'Dernier timestamp pour le boitier : ' + boitier + ' => ' + lasttime + ' / ' + moment(lasttime).format());

		res.json({
			timestamp: lasttime,
			schedule_mtime: schedule_mtime
		});
		return next();
	});
});

server.post('/vote/:idboitier', function(req, res, next) {
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

		winston.info('[' + req.connection.remoteAddress + '] Vote sur le boitier ' + boitier + ':', vote);
	}
	res.send("ok");
	next();
});

server.get('/top/:nb', function(req, res, next) {

	var nombre = req.params.nb;
	var results = {};
	var row_num = 1;
	db.each("SELECT sessionId, nb_votes, (somme + (nb_votes - somme)/2)/nb_votes as average from " +
		"(SELECT sessionId, sum(vote) as somme, count(vote) as nb_votes " +
		"from votes group by sessionId) order by average desc, nb_votes desc limit " + nombre , function (error, row) {

		var sessionId = row.sessionId;
		var cur_sess = row_num;
		results[cur_sess] = row;

		var title = proposalsMap[sessionId];
		results[cur_sess].titre = title ? title : "Non trouvé";

		row_num += 1;

	}, function () {
		res.send(results);
		next();
	});
});

server.get('/.*', restify.serveStatic({
	directory: './static',
	default: 'index.html'
}));

server.listen(3000, function() {
	winston.info('Listening on port 3000');
});
