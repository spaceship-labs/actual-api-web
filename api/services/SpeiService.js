var Promise = require('bluebird');
var moment = require('moment');
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

module.exports = {
	sendUnpaidOrdersReminder: sendUnpaidOrdersReminder,
	sendExpirationOrders: sendExpirationOrders
};

function sendUnpaidOrdersReminder(){
	console.log('sendUnpaidOrdersReminder' , new Date());
	var currentDate = new Date();
	var ordersIds;
	var query = {
		isSpeiOrder: true,
		speiExpirationReminderStartDate: {'<=': currentDate},
		status: 'pending-payment',
		paymentReminderSent: {'!':true},
	};
	return OrderWeb.find(query)
		.populate('Store')
		.populate('Client')
		.populate('QuotationWeb')
		.then(function(orders){

			if(!orders){
				return Promise.resolve();
			}

			ordersIds = orders.map(function(order){return order.id;});

			return Promise.map(orders, function(order){
				var clientName = order.Client.CardName;
				var clientEmail = order.Client.E_Mail;
				var folio = order.QuotationWeb.folio;
				var store = order.Store;
				var speiExpirationPayment = order.speiExpirationPayment;
				sails.log.info('quotation folio reminder', folio);
				return Email.sendSpeiReminder(clientName, clientEmail, speiExpirationPayment,folio, store);
			});
		})
		.then(function(){
			if(ordersIds && ordersIds.length > 0){
				return OrderWeb.update({id: ordersIds}, {paymentReminderSent:true});
			}else{
				return Promise.resolve();
			}
		});
}

function sendExpirationOrders(){
	console.log('sendExpirationOrders' , new Date());
	var currentDate = new Date();
	var ordersIds;
	var query = {
		isSpeiOrder: true,
		speiExpirationPayment: {'<=': currentDate},
		status: 'pending-payment',
		paymentExpirationSent: {'!':true},
	};
	return OrderWeb.find(query)
		.populate('Store')
		.populate('Client')
		.populate('QuotationWeb')
		.then(function(orders){

			if(!orders){
				return Promise.resolve();
			}

			ordersIds = orders.map(function(order){return order.id;});

			return Promise.map(orders, function(order){
				var clientName = order.Client.CardName;
				var clientEmail = order.Client.E_Mail;
				var folio = order.QuotationWeb.folio;
				var store = order.Store;
				sails.log.info('quotation folio expiration', folio);
				return Email.sendSpeiExpiration(clientName, clientEmail,folio, store);
			});
		})
		.then(function(){
			if(ordersIds && ordersIds.length > 0){
				return OrderWeb.update({id: ordersIds}, {paymentExpirationSent:true});
			}else{
				return Promise.resolve();
			}
		});
}