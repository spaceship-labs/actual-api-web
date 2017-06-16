var baseUrl = process.env.SAP_URL; //'http://sapnueve.homedns.org:8080'
var request = require('request-promise');
var Promise = require('bluebird');
var buildUrl = require('build-url');
var _ = require('underscore');
var fs = require('fs');
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;


var reqOptions = {
  method: 'POST',
  json: true
};

module.exports = {
  syncProductByItemCode: syncProductByItemCode,
  completeZipcode: completeZipcode
};

function syncProductByItemCode(itemCode){
  var path = 'Product';
  var requestParams = {
    ItemCode: itemCode
  };
  var endPoint = buildUrl(baseUrl,{
    path: path,
    queryParams: requestParams
  });  

  sails.log.info('endPoint syncProduct', endPoint);
  reqOptions.method = 'PUT';
  reqOptions.uri = endPoint;
  return request(reqOptions);  
}

function completeZipcode(){
  var counter = 0;
  ZipcodeDelivery.find({})
    .then(function(zipcodedeliveries){
      
      return Promise.map(zipcodedeliveries,function(zipcodedelivery){
        var params;
        if(zipcodedelivery.cp.toString().length === 4){
          params ={cp: "0"+zipcodedelivery.cp };
        }else{
          params ={cp: ""+zipcodedelivery.cp };          
        }
        var query = {
          _id: ObjectId(zipcodedelivery.id)
        };
        counter++;
        
        return Common.nativeUpdateOne(query, params, ZipcodeDelivery);
      })
    })
    .then(function(mapFinished){{
      sails.log.info('counter',counter);
    }})
}