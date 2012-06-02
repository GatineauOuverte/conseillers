var querystring = require('querystring')
  , url = require('url')
  , https = require('https')
  , config = require('config')
  , mongoose = require('mongoose')
  , async = require('async')
  , FeedParser = require('feedparser')
  , Activity = require('./models/activity');
  ;

// configure mongodb
mongoose.connect('mongodb://' + config.mongodb.user + ':' + config.mongodb.password + '@' + config.mongodb.server +':' + config.mongodb.port + '/' + config.mongodb.database);
mongoose.connection.on('error', function (err) {
  console.error('MongoDB error: ' + err.message);
  console.error('Make sure a mongoDB server is running and accessible by this application')
});

var conseillers = require('./public/data/conseillers.json');

//Atom Feeds
var monitorFeed = function () {

  function feedCallback (error, meta, articles, conseiller){
    if (error) console.error(error);
    else {
      articles.forEach(function (article){

        var source = url.parse(article.link, true);
        if (source.hostname == 'news.google.com' || source.hostname == 'news.google.com') {
          source = url.parse(source.query.url);
        }

        var instance = new Activity();
        instance.conseiller = conseiller.first_name + ' ' + conseiller.last_name;
        instance.title = article.title;
        instance.guid = article.guid;
        instance.posted_on = article.pubdate;
        instance.source = source.hostname;
        instance.url = article.origlink || article.link;
        instance.content = article.description;
        instance.save(function(err) {
          if (err) { console.error(err); }
          console.log(source.hostname + ' - ' + instance.title);
        });
      });
    }
  }

  //Website
  conseillers.forEach(function(conseiller) {
    if (conseiller.feed == undefined || conseiller.feed == '') { return; }

    //anonymous, self executing function to keep 'conseiller' in scope
    (function(conseiller){
      var parser = new FeedParser();
      parser.parseUrl(conseiller.feed, function(error, meta, articles) {
        feedCallback(error, meta, articles, conseiller);
      });
    })(conseiller);
  });

  //Google News
  conseillers.forEach(function(conseiller) {
    var googleNewsUrl = 'http://news.google.ca/news?';
    var googleNewsParams = {
        pz: 1
      , output: 'atom'
      , hl: 'fr'
      , num: 100
      , scoring: 'n'
      , ned: 'fr_ca'
      , as_drrb: 'q'
      , as_qdr: 'a'
      , q: '"' + conseiller.first_name + ' ' + conseiller.last_name + '"'
    };
    var googleNewsParams = querystring.stringify(googleNewsParams);

    (function(conseiller){
      var parser = new FeedParser();
      parser.parseUrl(googleNewsUrl + googleNewsParams, function(error, meta, articles) {
        feedCallback(error, meta, articles, conseiller)
      });
    })(conseiller);
  });
};

//Twitter Feeds
var monitorTwitter = function() {
  var options = {
      host: 'api.twitter.com'
    , path: '/1/statuses/user_timeline/MPedneaudJobin.json'
  };
  https.get(options, function(res) {
    res.setEncoding('utf8');
    console.log("Got response: " + res.statusCode);
    var buff = '';
    res.on('data', function(chunk) {
      buff += chunk.toString();
    });
    res.on('end', function() {
      var tweets = JSON.parse(buff);
      tweets.forEach(function(tweet){
        console.log('@' + tweet.user.screen_name + ': ' + tweet.text);
      });
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
};

//Facebook Feeds
var monitorFacebook = function() {
  var options = {
      host: 'graph.facebook.com'
    , path: '/pedneaudjobin/feed?access_token=' + config.facebook.access_token
  };
  https.get(options, function(res) {
    res.setEncoding('utf8');
    console.log("Got response: " + res.statusCode);
    var buff = '';
    res.on('data', function(chunk) {
      buff += chunk.toString();
    });
    res.on('end', function() {
      var posts = JSON.parse(buff);
      posts.data.forEach(function(post){
        console.log(post.message);
      });
    });
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
  });
};



async.series([monitorFeed, monitorTwitter], function(err) {
  if (err && err.code !== 11000) {
    console.dir(err);
  } else {
    console.log('Update complete');
  }
  mongoose.connection.close();
  process.exit();
});


