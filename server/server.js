var restify = require('restify'),
    fs = require('fs'),
    http = require('http'),
    request = require('request')
    winston = require('winston'),
    moment = require('moment'),
    sqlite3 = require('sqlite3').verbose();

var data_dir = process.env.DATA_DIR || __dirname,
    schedule_file = data_dir + '/schedule.json',
    database_file = data_dir + '/server_votes.db';

// -- INIT --
winston.remove(winston.transports.Console);
winston.add(winston.transports.Console, { timestamp: true });

var db = new sqlite3.Database(database_file, function(err) {
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

var programJSON = null;

function downloadSchedule() {
    var url = process.env.SCHEDULE_URL
    winston.info("Downloading schedule from " + url);
    request.get(
        {
            method: "GET",
            uri: url,
            headers: {
                "User-Agent": "nodejs"
            }
        },
        function (error, response, body) {
            if (!error && response.statusCode == 200) {
                winston.info("Schedule downloaded");
                programJSON = JSON.parse(body);
                fs.writeFileSync(schedule_file, body);
            } else {
                winston.error("Got error when downloading schedule, using local version: ", error);
                programJSON = JSON.parse(fs.readFileSync(schedule_file));
                cacheTitle();
            }
        }
    );
}

var proposalsMap = {};
function cacheTitle() {
    // map proposal cache
    for (var i = 0 ; i < programJSON.length ; i++) {
        var talk = programJSON[i];
        var id = talk.id;
        proposalsMap[id] = talk.name;
    }
}

downloadSchedule();

// Web server setup

var server = restify.createServer();
server.use(restify.bodyParser());
server.use(restify.authorizationParser());

// -- USER/PASS --
server.use(function (req, res, next) {
    var toAuth = req.url.match('^\/status\/.*$') || req.url.match('^\/vote\/.*$');
        var auth = req.authorization;

        if (!toAuth || auth && auth.scheme == "Basic"
                        && auth.basic.username == 'bzhcamp' && auth.basic.password == 'CHANGEME') {
                return next();
        }

    res.header('WWW-Authenticate', 'Basic realm="LikeBox"');
    return next(new restify.UnauthorizedError("Invalid username or password"));
});

// -- MAPPING URL --
server.post('/program', function(req, res, next) {
    downloadSchedule();
    res.send("ok");
    next();
});

var venueFor = {};
// By box number and Raspberry serial number
venueFor['1'] = venueFor['000000002d177ce5'] = "378156"; // Level 1, Room 111
venueFor['2'] = venueFor['0000000012cc151e'] = "375424"; // Level 1, Room 112
venueFor['3'] = venueFor['00000000b480167d'] = "375421"; // Level 1, Room 113
venueFor['4'] = venueFor['00000000c9b1bb20'] = "378155"; // Level 1, Room 114
venueFor['5'] = venueFor['00000000bffde9a5'] = "378151";
venueFor['6'] = venueFor['000000006ddccfec'] = "378151";
venueFor['7'] = venueFor['00000000748cfa28'] = "378151"; // Auditorium


server.get('/schedule/:idboitier', function(req, res, next) {
    var boitier = req.params.idboitier;
    var venue = venueFor[boitier];

    var boxSchedule = [];
    for (var i = 0 ; i < programJSON.length ; i++) {
        var talk = programJSON[i];
        if (talk.venue_id == venue) {
            boxSchedule.push(talk)
        }
    }
    res.json(boxSchedule);
    return next();
});

server.get('/status/:idboitier', function(req, res, next) {
    var boitier = req.params.idboitier;
    var stats = fs.statSync(schedule_file);
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
    db.each("SELECT sessionId, nb_votes, (somme/nb_votes) as average from " +
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
    directory: __dirname + '/static',
    default: 'index.html'
}));

server.listen(3000, function() {
    winston.info('Listening on port 3000');
});
