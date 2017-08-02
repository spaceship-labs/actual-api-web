/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#!/documentation/reference/sails.config/sails.config.bootstrap.html
 */
var moment = require('moment-timezone');

module.exports.bootstrap = function(cb) {
  //process.env.LOG_QUERIES =  true;

  CronJobs.init();
  Files.getContainerLink();

  var msgMode = 'sandbox/dev';
	if(process.env.MODE === 'production'){
		msgMode = 'production';
	}

  sails.log.info('Lifted ' + msgMode + ' mode');  

  sails.config.timezone = {label:'America/Cancun', offset:-6};
  //moment.tz.setDefault(sails.config.timezone.label);

  // It's very important to trigger this callback method when you are finished
  // with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
  cb();
};
