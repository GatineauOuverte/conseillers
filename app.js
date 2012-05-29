
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , config = require('config')
  , mongoose = require('mongoose')
;

var app = module.exports = express.createServer();

// configure mongodb
mongoose.connect('mongodb://' + config.mongodb.user + ':' + config.mongodb.password + '@' + config.mongodb.server +':' + config.mongodb.port + '/' + config.mongodb.database);
mongoose.connection.on('error', function (err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application')
});


// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', { pretty: config.view.pretty });
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  if (config.mongodb.verbose) mongoose.set('debug', true);
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.listen(config.server.port, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
