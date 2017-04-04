var Promise = require('bluebird');
var conekta = require('conekta');
var LOCAL_CURRENCY = 'MXN';
var CONEKTA_PAYMENT_TYPE_CARD = 'card';

conekta.locale = 'es';
conekta.api_version = '2.0.0';


module.exports = {
	createOrder: createOrder,
	chargeOrder: chargeOrder,
	test: test
};

function test(req){
	conekta.api_key = SiteService.getConektaKeyBySite(req);
	sails.log.info('req.headers.site', req.headers.site);
	sails.log.info('api_key', conekta.api_key);
}


function createOrder(orderId, req) {
	conekta.api_key = SiteService.getConektaKeyBySite(req);
	sails.log.info('req.headers.site', req.headers.site);
	sails.log.info('api_key', conekta.api_key);
	var order;

	return QuotationWeb.findOne({id: orderId}).populate('Payments')
		.then(function(orderFound){
			order = orderFound;

			var promises = [
				getOrderCustomerInfo(order.User),
				getOrderLineItems(order.id)
			];

			return promises;
		})
		.spread(function(customerInfo, lineItems){
			var discountLine = getOrderDiscountLine(order);
			var charges = getOrderCharges(order, order.Payments);

			return new Promise(function(resolve, reject){

				var conektaOrderParams = {
					currency: LOCAL_CURRENCY,
					customer_info: customerInfo,
					line_items: lineItems,
					discount_lines: [discountLine],
					charges: charges,
					shipping_lines:[{
						amount: 0,
						carrier: 'Fedex'
					}],
					shipping_contact:{
	          receiver: "Mario perez",
	          phone: "+5215555555555",
	          between_streets: "Street 1 and Street 2",
	          address: {
	              "street1": "Wallaaby",
	              "city": "Sydney",
	              "state": "P. Sherman",
	              "postal_code": "78215",
	              "country": "MX"
						}					
					}
				};

				sails.log.info('conektaOrderParams', conektaOrderParams);

				conekta.Order.create(conektaOrderParams, function(err, res) {
					if(err){
						console.log('err conekta', err);
						reject(err);
					}

					var order =  res.toObject();
					console.log('ID', order.id);
					resolve(order); 
				});

			});

		});
}

function getOrderCharges(order, orderPayments){
	orderPayments = orderPayments || [];
	return orderPayments.map(function(payment){
		var charge = {
			//amount: convertToCents(payment.ammount),
			amount: convertToCents(order.total),
			token_id: payment.cardToken,
			payment_method:{
				type: CONEKTA_PAYMENT_TYPE_CARD,
				token_id: payment.cardToken
			}
		};
		return charge;
	});
}

function getOrderDiscountLine(order){
	var discountLine = {
		code: 'Descuento general',
		type: 'campaign',
		amount: convertToCents(order.discount || 0)
	};
	return discountLine;
}

function getOrderCustomerInfo(clientId){
	return UserWeb.findOne({id: clientId})
		.then(function(user){
			var customerInfo = {
				name: user.firstName + ' ' + user.lastName,
				phone: '5215555555555',
				//phone: user.phone,
				email: user.email
			};
			return customerInfo;
		});
}

function getOrderLineItems(orderId){
	return QuotationDetailWeb.find({Quotation: orderId}).populate('Product')
		.then(function(details){
			return mapDetailsToLineItems(details);
		});
}

function mapDetailsToLineItems(details){
	return details.map(function(detail){
		var lineItem = {
			name: detail.Product.ItemName,
			unit_price: convertToCents(detail.unitPrice),
			quantity: detail.quantity,
			sku: detail.Product.ItemCode,
		};
		return lineItem;
	});
}

function convertToCents(amount){
	var centsAmount = parseInt(amount * 100);
	return centsAmount;
}

function chargeOrder(order, req) {
	conekta.api_key = SiteService.getConektaKeyBySite(req);
	
	return new Promise(function(resolve, reject){
		var params = {
			"payment_method": {
				"type": "card",
				"expires_at": 1479167175
			},
			"amount": 350000
		};
		conekta.Order.find(order.id, function(err, order) {
		    order.createCharge(params, function(err, charge) {
		        if(err){
		        	reject(err);
		        }
		        console.log(charge);
		    	resolve(charge);
		    });
		}); 

	});
}
