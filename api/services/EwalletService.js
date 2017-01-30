var EWALLET_NEGATIVE = 'negative';
var EWALLET_TYPE = 'ewallet';
var Promise = require('bluebird');

module.exports = {
	applyEwalletRecord: applyEwalletRecord,
	isValidEwalletPayment: isValidEwalletPayment
};

function isValidEwalletPayment(payment, client){
  if (client.ewallet < payment.ammount || !client.ewallet) {
  	return false;
  }
  return true;
}

function applyEwalletRecord(payment, options){
	var client = options.client;
  if (client.ewallet < payment.ammount || !client.ewallet) {
    return Promise.reject(new Error('Fondos insuficientes en monedero electronico'));
  }
  var updateParams = {ewallet: client.ewallet - payment.ammount};
  
  return Client.update(client.id, updateParams)
	  .then(function(clientUpdated){
		    if(payment.type == EWALLET_TYPE){
		      var ewalletRecord = {
		        Store: payment.Store,
		        Quotation: options.quotationId,
		        User: options.userId,
		        Client: options.client.id,
		        Payment: options.paymentId,
		        type: EWALLET_NEGATIVE,
		        amount: payment.ammount
		      };
		      return EwalletRecord.create(ewalletRecord);
		    }
		    return null;
	    });
}