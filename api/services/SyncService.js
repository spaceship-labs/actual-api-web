var baseUrl = process.env.SAP_URL; //'http://sapnueve.homedns.org:8080'
var request = require('request-promise');
var Promise = require('bluebird');
var buildUrl = require('build-url');
var _ = require('underscore');
var fs = require('fs');

var reqOptions = {
  method: 'POST',
  json: true
};

module.exports = {
  syncProductByItemCode: syncProductByItemCode,
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