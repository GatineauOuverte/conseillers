<?php

//   Using Zend Framework: REQUIRE the content of the /library/ folder from
//   http://framework.zend.com/releases/ZendFramework-1.11.11/ZendFramework-1.11.11-minimal.tar.gz
//   in ../vendor/ folder

// Ca ne devrait pas etre permis qu'un framework nous force a changer le include path
set_include_path(implode(PATH_SEPARATOR, array(
    realpath(dirname(__FILE__) . '/vendor'),
    get_include_path(),
)));

require_once 'Zend/Loader/Autoloader.php';
Zend_Loader_Autoloader::getInstance();

$aggregate = array();

//@TODO add error validation
$conseillers = json_decode(file_get_contents(__DIR__ . '/../data/conseillers.json'));

/**
 * Find feeds for each conseillers' website
 */
$feeds = array();
foreach ($conseillers as $conseiller) {
    $website = $conseiller->web;
    if (!empty($website)) {
        $feedSet = Zend_Feed::findFeeds($website);

        if (is_array($feedSet) && !empty($feedSet)) {
            //TODO choose the best one, not necessary the first one
            $links = array_keys($feedSet);
            $feeds[] = $links[0];
        }
    }
}

/**
 * Fetch blogs
 */
foreach ($feeds as $link) {
  try {
      $feed = Zend_Feed_Reader::import($link);
  } catch (Exception $e) {
      echo 'Error: Cannot read feed ' . $link . PHP_EOL;
      $feed = array();
  }

  foreach ($feed as $item) {
      $post = array();
      $post['title'] = $item->getTitle();
      $post['content'] = $item->getContent();
      $post['url'] = $item->getLink();
      $post['posted_on'] = date('Y-m-d H:i:s', strtotime($item->getDateCreated()));
      $post['guid'] = $item->getId();
      $aggregate[] = $post;
  }
}

/**
 * Fetch Twitter posts
 */
$timelineUrl = 'http://api.twitter.com/1/statuses/user_timeline/';
$httpClient = new Zend_Http_Client();
foreach ($conseillers as $conseiller) {
    $httpClient->setUri($timelineUrl . trim($conseiller->twitter, '@') . '.json');
    $response = $httpClient->request();
    $content = Zend_Json::decode($response->getbody());

    foreach ($content as $tweet) {
        // wtf? le bug twitter du jour
        //TODO enlever ce hack temporaire
        if (empty($tweet['text'])) { continue; }
        $post = array();
        $post['title'] = $conseiller->twitter;
        $post['content'] = $tweet['text'];
        $post['posted_on'] = date('Y-m-d H:i:s', strtotime($tweet['created_at']));
        $post['guid'] = (string) $tweet['id'];
        $aggregate[] = $post;
    }
}

/**
 * Google News
 * https://github.com/opennorth/mamairie/blob/master/app/models/activity.rb
 */
$googleNewsUrl = 'http://news.google.ca/news?';
$googleNewsParams = array(
    'pz' => 1,
    'output' => 'rss',
    'hl' => 'fr',
    'num' => 100,
    'scoring' => 'n',
    'ned' => 'fr_ca',
    'as_drrb' => 'q',
    'as_qdr' => 'a',
);

foreach ($conseillers as $conseiller) {
    try {
        $googleNewsParams['q'] = $conseiller->first_name . ' ' . $conseiller->last_name;
        $feedConseiller = $googleNewsUrl . http_build_query($googleNewsParams);
        $feed = Zend_Feed_Reader::import($feedConseiller);
  } catch (Exception $e) {
      echo 'Error: Cannot read feed for ' . $googleNewsParams['q'] . PHP_EOL;
      $feed = array();
  }

  foreach ($feed as $item) {
      $post = array();
      $post['title'] = $item->getTitle();
      $post['content'] = $item->getContent();
      $post['url'] = $item->getLink();
      $post['posted_on'] = date('Y-m-d H:i:s', strtotime($item->getDateCreated()));
      $post['guid'] = $item->getId();
      $aggregate[] = $post;
  }
}

file_put_contents('./aggregate.json', json_encode($aggregate));

