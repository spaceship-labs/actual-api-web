var cron = require('cron').CronJob;
var Promise = require('bluebird');

module.exports.init = function(){
  console.log('initing cronJobs');
  var cronJobs = [
      //time: '0 */4 * * * *'
      //s,m,h,d del mes,m,d de la semana
    {
      fn: function(d){
        //sails.log.info('sendUnpaidOrdersReminder');
        SpeiService.sendUnpaidOrdersReminder();
        SpeiService.sendExpirationOrders();
      },
      time:'*/30 * * * *'
    }

  ].forEach(function(v){
    
    if(process.env.NODE_ENV === 'production' || true){
      new cron(v.time,v.fn, true, true);
    }
  
  });
};
