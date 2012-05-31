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
$conseillers = json_decode(file_get_contents(__DIR__ . '/../public/data/conseillers.json'));

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
            $feeds[] = array(
              'conseiller' => $conseiller->first_name . ' ' . $conseiller->last_name,
              'link' => $links[0]
            );
        }
    }
}

/**
 * Fetch blogs
 */
foreach ($feeds as $entry) {

  try {
      $feed = Zend_Feed_Reader::import($entry['link']);
  } catch (Exception $e) {
      echo 'Error: Cannot read feed ' . $entry['link'] . PHP_EOL;
      $feed = array();
  }

  foreach ($feed as $item) {
      $post = array();
      $post['conseiller'] = $entry['conseiller'];
      $post['title'] = $item->getTitle();
      $post['content'] = $item->getContent();
      $post['url'] = $item->getLink();
      $post['posted_on'] = date('Y-m-d H:i:s', strtotime($item->getDateCreated()));
      $post['guid'] = $item->getId();
      $post['source'] = 'website';
      $aggregate[] = $post;
  }
}

/**
 * Fetch Twitter posts
 */
$timelineUrl = 'http://api.twitter.com/1/statuses/user_timeline/';
$httpClient = new Zend_Http_Client();
foreach ($conseillers as $conseiller) {
    if (empty($conseiller->twitter)) {
        continue;
    }
    $httpClient->setUri($timelineUrl . trim($conseiller->twitter, '@') . '.json');
    $response = $httpClient->request();
    $content = Zend_Json::decode($response->getbody());

    foreach ($content as $tweet) {
        // wtf? le bug twitter du jour
        //TODO enlever ce hack temporaire
        if (empty($tweet['text'])) { continue; }
        $post = array();
        $post['conseiller'] = $conseiller->first_name . ' ' . $conseiller->last_name;
        $post['title'] = $conseiller->twitter;
        $post['content'] = $tweet['text'];
        $post['posted_on'] = date('Y-m-d H:i:s', strtotime($tweet['created_at']));
        $post['guid'] = (string) $tweet['id'];
        $post['source'] = 'twitter';
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
        $sourceLink = parse_url($item->getLink());
        parse_str($sourceLink['query'], $sourceQuery);
        $source = $sourceQuery['url'];
        $post = array();
        $post['conseiller'] = $conseiller->first_name . ' ' . $conseiller->last_name;
        $post['title'] = $item->getTitle();
        $post['content'] = $item->getContent();
        $post['url'] = $item->getLink();
        $post['posted_on'] = date('Y-m-d H:i:s', strtotime($item->getDateCreated()));
        $post['guid'] = $item->getId();
        $post['source'] = $source;
        $aggregate[] = $post;
    }
}

file_put_contents('./aggregate.json', json_encode($aggregate));

