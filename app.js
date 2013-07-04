
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path');

var app = express();

// all environments
app.set('port', process.env.PORT || 3001);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

//database
var mongo = {
	"hostname" : "localhost",
	"port": 27017,
	"username": "",
	"password": "",
	"name": "",
	"db": "trode"
}
var generate_mongo_url = function(obj) {
	obj.hostname = (obj.hostname || "localhost");
	obj.port = (obj.port || 27017);
	obj.db = (obj.fb || "trode");
	if(obj.username && obj.password) {
		return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db;
	}
	else {
		return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db;
	}
}
var mongourl = generate_mongo_url(mongo);

var getQS = function(req) {
	var url = require('url'); 
	var urlObj = url.parse(req.url);
	var qs = urlObj.query;
	console.log("qs is : " + qs);
	var querystring = require('querystring');
	return querystring.parse(qs)
}

// routes
app.get('/', routes.index);
app.post('/track/:type', function(req, res) {
	require('mongodb').connect(mongourl, function(err, conn) {
		if(req.params.type) {
			console.log("Tracking an object of type: " + req.params.type);
			collection_name = req.params.type;
			conn.collection(collection_name, function(err, coll) {
				coll.insert(req.body, {safe:true}, function(err) {
					res.writeHead("200", {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*"
					});
					res.end(JSON.stringify(req.body));
				});
			});
		}
		else {
			res.statusCode = 404;
			return res.send('Error 404: No quote found');
		}
	});
});

app.get('/track/:type', function(req, res) {
	require('mongodb').connect(mongourl, function(err, conn) {
		if(req.params.type) {
			console.log("Retrieving objects of type: " + req.params.type);
			collection_name = req.params.type;
			filter = null;
			var qs = getQS(req);
			if(qs) {
				console.log("Applying filter");
				filter = qs;
			}
			conn.collection(collection_name, function(err, coll) {
				coll.find(filter, function(err, cursor) {
					cursor.toArray(function(err, items) {
						res.writeHead(200, {
							"Content-Type": "application/json",
							"Access-Control-Allow-Origin": "*"
						});
						res.end(JSON.stringify(items));
					});
				});
			});
		}
		else {
			res.statusCode = 404;
			return res.send('Error 404: No quote found');
		}
	});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
