var querystring = require('querystring')
  , http = require('http')
  , FeedParser = require('feedparser')
  , parser = new FeedParser()
  ;

function myCallback (error, meta, articles){
  if (error) console.error(error);
  else {
    console.log('Feed info');
    console.log('%s - %s - %s', meta.title, meta.link, meta.xmlUrl);
    console.log('Articles');
    articles.forEach(function (article){
      console.log('%s - %s (%s)', article.date, article.title, article.link);
    });
  }
}

var conseillers = require('./public/data/conseillers.json');

//Atom Feeds
var monitorFeed = function () {
  function feedCallback (error, meta, articles){
    if (error) console.error(error);
    else {
      console.log('Feed info');
      console.log('%s - %s - %s', meta.title, meta.link, meta.xmlUrl);
      console.log('Articles');
      articles.forEach(function (article){
        console.log('%s - %s (%s)', article.date, article.title, article.link);
      });
    }
  }

  //Website
  conseillers.forEach(function(conseiller) {
    if (conseiller.feed == undefined) { return; }
    parser.parseUrl(conseiller.feed, feedCallback);
  });

  //Google News
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
    , q: "Maxime Pedneaud-Jobin"
  };
  var googleNewsParams = querystring.stringify(googleNewsParams);
  parser.parseUrl(googleNewsUrl + googleNewsParams, myCallback);
};

//Twitter Feeds
var monitorTwitter = function() {
  var options = {
    host: 'api.twitter.com',
    port: 80,
    path: '/1/statuses/user_timeline/MPedneaudJobin.json'
  };
  http.get(options, function(res) {
    res.setEncoding('utf8');
    console.log("Got response: " + res.statusCode);
    var buff = '';
    res.on('data', function(chunk) {
      buff += chunk;
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

};

//TODO move these function above in separate libraries
