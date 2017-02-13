var cron = require('cron').CronJob;
var Promise = require('bluebird');

module.exports.init = function(){
  console.log('initing cronJobs');
  var cronJobs = [
    {
      fn: function(d){
        getPromos();
      },
      time:'0 0 */4 * * *'
      //time: '0 */4 * * * *'
      //s,m,h,d del mes,m,d de la semana
    },
    {
      fn: function(d){
        //CategoryService.cacheCategoriesProducts();
      },
      time:'0 0 */1 * * *'
    },
    {
      fn: function(d){
        //ProductService.cacheProductDiscountPrices();
      },
      time:'0 0 */1 * * *'
    }

  ].forEach(function(v){
    
    if(process.env.NODE_ENV === 'production'){
      new cron(v.time,v.fn, true, true);
    }
  
  });
};
