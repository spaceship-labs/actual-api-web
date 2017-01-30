var CLIENT_BALANCE_NEGATIVE = 'negative';
var CLIENT_BALANCE_TYPE = 'client-balance';
var Promise = require('bluebird');

module.exports = {
	applyClientBalanceRecord: applyClientBalanceRecord,
	isValidClientBalancePayment: isValidClientBalancePayment
};

function isValidClientBalancePayment(payment, client){
  if (client.Balance < payment.ammount || !client.Balance) {
  	return false;
  }
  return true;
}

function applyClientBalanceRecord(payment, options){
	var client = options.client;
  if (client.Balance < payment.ammount || !client.Balance) {
    return Promise.reject(new Error('Fondos insuficientes en balance de cliente'));
  }
  var updateParams = {Balance: client.Balance - payment.ammount};

  return Client.update({id:client.id}, updateParams)
	  .then(function(clientUpdated){
		    if(payment.type == CLIENT_BALANCE_TYPE){
		      var clientBalanceRecord = {
		        Store: payment.Store,
		        Quotation: options.quotationId,
		        User: options.userId,
		        Client: options.client.id,
		        Payment: options.paymentId,
		        type: CLIENT_BALANCE_NEGATIVE,
		        amount: payment.ammount
		      };
		      return ClientBalanceRecord.create(clientBalanceRecord);
		    }
		    return null;
	    });
}