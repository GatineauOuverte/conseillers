//FIXME this script hang because FeedParser stays open

var querystring = require('querystring')
  , url = require('url')
  , https = require('https')
  , config = require('config')
  , mongoose = require('mongoose')
  , async = require('async')
  , FeedParser = require('feedparser')
  , bleach = require('bleach')
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
        instance.content = bleach.sanitize(article.description);
        instance.save(function(err) {
          // We don't insert duplicate, so we expect errors 11000 to happen
          if (err) {
            if (err.code === 11000) {
              console.log('Ignoring duplicate entry');
            } else {
              console.error(err);
            }
          }
          console.log('Feed: ' + source.hostname + ' - ' + instance.title);
        });
      });
    }
  }

  //Website
  conseillers.forEach(function(conseiller) {
    if (conseiller.feed == undefined || conseiller.feed == '') { return; }

    //anonymous, self executing function to keep 'conseiller' in scope
    (function(conseiller){
      debugger;
      var parser = new FeedParser();
      parser.on('end', function(n) { parser = null; });
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

  function saveTweets(tweets, conseiller) {
    tweets.forEach(function(tweet){

      var instance = new Activity();
      instance.conseiller = conseiller.first_name + ' ' + conseiller.last_name;
      instance.title = tweet.user.screen_name;
      instance.guid = tweet.id_str;
      instance.posted_on = tweet.created_at;
      instance.source = 'twitter';
      instance.url = 'https://twitter.com/' + tweet.user.screen_name + '/status/' + tweet.id_str;
      instance.content = bleach.sanitize(tweet.text);
      instance.save(function(err) {
          // We don't insert duplicate, so we expect errors 11000 to happen
          if (err) {
            if (err.code === 11000) {
              console.log('Ignoring duplicate entry');
            } else {
              console.error(err);
            }
          }
          console.log('Twitter: ' +  tweet.user.screen_name + ' - ' + tweet.text);
      });

      console.log(instance.title.first_name + ': ' + instance.content);
    });
  };

  conseillers.forEach(function(conseiller) {
    if (conseiller.twitter == undefined || conseiller.twitter == '') { return; }

    var options = {
        host: 'api.twitter.com'
      , path: '/1/statuses/user_timeline/' + conseiller.twitter + '.json'
    };

    (function(conseiller){
      var req = https.get(options, function(res) {
        res.setEncoding('utf8');
        var buff = '';
        res.on('data', function(chunk) {
          buff += chunk.toString();
        });
        res.on('end', function() {
          var tweets = JSON.parse(buff);
          saveTweets(tweets, conseiller);
        });
      });
      req.on('error', function(e) {
        console.log("Got error: " + e.message);
      });
    })(conseiller);

  });
};


//Facebook Feeds
var monitorFacebook = function() {

  function savePosts(posts, conseiller) {
    posts.forEach(function(post){
      // only if it's a status update by this person, not post by random user on this users wall/timeline
      if (post.from.id == conseiller.facebook_id && post.type == 'status') {
        var instance = new Activity();
        instance.conseiller = conseiller.first_name + ' ' + conseiller.last_name;
        instance.title = '';
        instance.guid = post.id;
        instance.posted_on = post.created_time;
        instance.source = 'facebook';
        instance.url = '';
        instance.content = bleach.sanitize(post.message);
        instance.save(function(err) {
          // We don't insert duplicate, so we expect errors 11000 to happe
          if (err) {
            if (err.code === 11000) {
              console.log('Ignoring duplicate entry');
            } else {
              console.error(err);
            }
          }
          console.log('Facebook: ' + instance.conseiller + ' - ' + instance.content);
        });
      }
    });
  };

  conseillers.forEach(function(conseiller) {
    if (conseiller.facebook_id == undefined || conseiller.facebook_id == '') { return; }

    var options = {
        host: 'graph.facebook.com'
      , path: '/' + conseiller.facebook_id + '/feed?access_token=' + config.facebook.access_token
    };

    (function(conseiller){
      var req = https.get(options, function(res) {
        res.setEncoding('utf8');
        var buff = '';
        res.on('data', function(chunk) {
          buff += chunk.toString();
        });
        res.on('end', function() {
          var posts = JSON.parse(buff);
          savePosts(posts.data, conseiller);
        });
      });
      req.on('error', function(e) {
        console.log("Got error: " + e.message);
      });
    })(conseiller);

  });

};

async.parallel([monitorFeed, monitorTwitter, monitorFacebook], function(err) {
  if (err) {
    console.dir(err);
  } else {
    console.log('Update complete');
  }

  setTimeout( function () {
    mongoose.connection.close();
  }, 1000);
});

