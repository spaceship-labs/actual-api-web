var request = require('supertest');
var sails = require('sails');
var chai = require('chai');
var fixtures = require('sails-fixtures');


before(function(done){
  // Increase the Mocha timeout so that Sails has enough time to lift.
  this.timeout(15000);

  sails.lift({
  	//config for testing purposes
    connections:{
      mongodb: {
        adapter: 'sails-mongo',
        host: 'localhost',
        port: 27017,
        user: '',
        password: '',
        database: 'actual-web-test',
        url: null
      }
    },
    fixtures: {
      order:['Store','Site', 'Company'],
      Store: require('./fixtures/stores.json'),
      Site: require('./fixtures/sites.json'),
      Company: require('./fixtures/warehouses.json')
    }

  }, function(err){
  	if(err) return done(err);

    global.app = request(sails.hooks.http.app);
    global.assert = chai.assert;
    global.expect = chai.expect;
    global.should = chai.should();

    // here you can load fixtures, etc.
  	done(err, sails);
  });

});

after(function(done){
	//here you can clear fixtures, etc.
	sails.lower(done);
});