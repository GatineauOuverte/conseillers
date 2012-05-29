var   mongoose = require('mongoose')
    , config = require('config')
    , fs = require('fs')
    , async = require('async')
    , Activity = require(__dirname + '/../models/activity')
;

// configure mongodb
mongoose.connect('mongodb://' + config.mongodb.user + ':' + config.mongodb.password + '@' + config.mongodb.server +':' + config.mongodb.port + '/' + config.mongodb.database);
mongoose.connection.on('error', function (err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application')
});
if (config.mongodb.verbose) mongoose.set('debug', true);


var fixtureActivity = function(callback) {
  var file = fs.readFileSync(__dirname + '/activity.json', 'utf8');
  var aggregate = JSON.parse(file);

  console.log('importing ' + aggregate.length + ' items');

  for(var i=0; i<aggregate.length; i++) {
    var act = new Activity(aggregate[i]);
    act.save(callback);
  }
};

async.series([fixtureActivity], function(err) {
  if (err) {
    console.dir(err);
  } else {
    console.log('Insertion complete');
  }
  mongoose.connection.close();
});
