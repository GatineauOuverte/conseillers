Mes Conseillers
===============

A simple website that track online activity of the conseillers municipaux de ville de Gatineau

Installation
------------

*Mes Conseillers* is a Node.js/ExpressJS application (requires at least Node.js 0.6.) and
uses MongoDb 2.0.x as the storage solution.

Clone the repository from GitHub and install dependencies using npm:

    git clone git://github.com/eleclerc/conseillers.git
    cd conseillers
    npm install

Start MongoDb

    ./mongodb-2.0.5/bin/mongod --dbpath ./mongodb-2.0.5/data

Start the application with:

    node app.js

(Optional) Import some data to test the app

    node fixtures/populate.js


License
-------

The *Mes Conseillers* code is free to use and distribute, under the [MIT license](https://raw.github.com/eleclerc/conseillers/master/LICENSE).

*Mes Conseillers* uses third-party libraries:

* [NodeJS](http://nodejs.org/), licensed under the [MIT License](https://github.com/joyent/node/blob/master/LICENSE#L5-22),
* [MongooseJS](http://mongoosejs.com/), licensed under the [MIT License](https://github.com/LearnBoost/mongoose/blob/master/README.md),
* [jQuery](http://jquery.com/), licensed under the [MIT License](http://jquery.org/license),
* [TwitterBootstrap](http://twitter.github.com/bootstrap/), licensed under the [Apache License v2.0](http://www.apache.org/licenses/LICENSE-2.0),

If you like the software, please help improving it by contributing Pull Requests on the [GitHub project](https://github.com/eleclerc/conseillers)!
