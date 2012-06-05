Mes Conseillers
===============

Un site web qui trace l'activité en ligne des Conseillers Municipaux de la ville
de Gatineau

Installation
------------

*Mes Conseillers* est une application Node.js/ExpressJS (nécessite Node.js >= 0.6)
et utilise une base de données NoSQL MongoDb 2.0.x pour le stockage.

Cloner le *repository* depuis GitHub

    git clone git://github.com/eleclerc/conseillers.git

Installer les dépendances

    cd conseillers
    npm install

Il est possible de se créer un fichier de configuration personnalisé pour utiliser
des parametre différents, il suffit de copier `config/default.json` en
`config/development.json`

Démarrer MongoDb (corriger le chemin de MongoDb en conséquence)

    ./mongodb-2.0.5/bin/mongod --dbpath ./mongodb-2.0.5/data

Lancer l'application avec cette commande

    node app.js

Par défaut ceci lance l'application en mode *development*, il est possible de
spécifier un autre mode comme ceci (pour charger `config/mymode.json`)

    NODE_ENV=mymode node app.js


(Optional) Importer des données test pour tester l'application

    node fixtures/populate.js

OU

(Optional) Executer le script d'import de donnees live
**facebook access token doit etre définit)

    node monitor.js

### Facebook access token

Le fichier de configuration `./config/default.json` doit contenir un
**Facebook Access Token** valide pour pouvoir executer le monitor.js

Suivre les instruction de la section "Obtain an App Access Token" de cette page

http://developers.facebook.com/docs/authentication/applications/

Résumé: Visiter ce URL avec les info de votre app Facebook

    https://graph.facebook.com/oauth/access_token?
      client_id=YOUR_APP_ID
      &client_secret=YOUR_APP_SECRET
      &grant_type=client_credentials



License
-------

Le code de *Mes Conseillers* est libre sous
[MIT license](https://raw.github.com/eleclerc/conseillers/master/LICENSE).

*Mes Conseillers* utilise des plusieurs autre librairies, tel que:

* [NodeJS](http://nodejs.org/), licensed under the [MIT License](https://github.com/joyent/node/blob/master/LICENSE#L5-22),
* [MongooseJS](http://mongoosejs.com/), licensed under the [MIT License](https://github.com/LearnBoost/mongoose/blob/master/README.md),
* [jQuery](http://jquery.com/), licensed under the [MIT License](http://jquery.org/license),
* [TwitterBootstrap](http://twitter.github.com/bootstrap/), licensed under the [Apache License v2.0](http://www.apache.org/licenses/LICENSE-2.0),

Si vous utilisez ce code, svp aidez nous a l'améliorer en contribuant au
[projet GitHub](https://github.com/eleclerc/conseillers)!
