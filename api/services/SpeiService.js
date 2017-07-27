var Promise = require('bluebird');
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

module.exports = {
	sendUnpaidOrdersReminder: sendUnpaidOrdersReminder
};

function sendUnpaidOrdersReminder(){
	var currentDate = new Date();
	var ordersIds;
	var query = {
		isSpeiOrder: true,
		speiExpirationReminderStartDate: {'<=': currentDate},
		paymentReminderSent: {'!':true},
	};
	return OrderWeb.find(query)
		.populate('Store')
		.populate('Client')
		.populate('QuotationWeb')
		.then(function(orders){
			
			sails.log.info('orders ids', ordersIds);
			ordersIds = orders.map(function(order){return order.id;});

			return Promise.all(orders, function(order){
				var clientName = order.Client.CardName;
				var clientEmail = order.Client.E_Mail;
				var folio = order.QuotationWeb.folio;
				var store = order.Store;
				return Email.sendSpeiReminder(clientName, clientEmail,folio, store);
			});
		})
		.then(function(){
			return OrderWeb.update({id: ordersIds}, {paymentReminderSent:true});
		});
}