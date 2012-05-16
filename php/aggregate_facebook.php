<?php

/**
 * This include file should define()
 * FACEBOOK_APP_ID, FACEBOOK_APP_SECRET, FACEBOOK_ACCESS_TOKEN
 * */
include 'fb.auth.php';

// Ca ne devrait pas etre permis qu'un framework nous force a changer le include path
set_include_path(implode(PATH_SEPARATOR, array(
    realpath(dirname(__FILE__) . '/vendor'),
    get_include_path(),
)));

require_once 'Zend/Loader/Autoloader.php';
Zend_Loader_Autoloader::getInstance();


require_once 'FacebookGraph.php';

$aggregate = array();

$facebook = new FacebookGraph(
          FACEBOOK_APP_ID,
          FACEBOOK_APP_SECRET
        );

$facebook->accessToken = FACEBOOK_ACCESS_TOKEN;

//@TODO add error validation
$conseillers = json_decode(file_get_contents(__DIR__ . '/../data/conseillers.json'));

foreach ($conseillers as $conseiller) {
    $facebookId = extractConseillerId($conseiller->facebook);
    if (empty($facebookId)) {
        continue;
    }

    // Obtenir info de base pour le conseiller
    $fbConseiller = $facebook->query('/' . $facebookId);

    $post = $facebook->query('/' . $facebookId . '/feed', array(
        'method' => 'GET',
    ));

    foreach ($post['data'] as $entry) {
        // pour l'instant je veux juste les posts du conseiller, pas les commentaires
        // que les gens font sur son wall
        if ($entry['type'] == 'status' && $entry['from']['id'] == $fbConseiller['id']) {
          $post = array();
          $post['conseiller'] = $conseiller->first_name . ' ' . $conseiller->last_name;
          $post['title'] = '';
          $post['content'] = $entry['message'];
          $post['url'] = '';
          $post['posted_on'] = date('Y-m-d H:i:s', strtotime($entry['created_time']));
          $post['guid'] = $entry['id'];
          $post['source'] = 'facebook';
          $aggregate[] = $post;
        }
    }
}

file_put_contents('./aggregate_facebook.json', json_encode($aggregate));



/**
 * ok j'ai pas le temps de faire ca clean.
 * si ya un param ID on le prend, sinon on prend le dernier segment du
 * url et on assume que c'est le friendly username
 *
 * @FIXME
 * @param $facebookUrl string
 * @return string userid
 */
function extractConseillerId($facebookUrl)
{
    $id = '';
    $query = array();

    $facebookUrl = parse_url($facebookUrl);
    if (!empty($facebookUrl['query'])) {
        parse_str($facebookUrl['query'], $query);
        if (!empty($query['id'])) {
            $id = $query['id'];
        }
    }

    if (empty($id)) {
        $path = explode('/', $facebookUrl['path']);
        $id = array_pop($path);
    }
    return $id;
}
