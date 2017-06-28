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


function createOrder(orderId, payment, req) {
	conekta.api_key = SiteService.getConektaKeyBySite(req);
	sails.log.info('req.headers.site', req.headers.site);
	sails.log.info('api_key', conekta.api_key);
	var order;

	return StockService.validateQuotationStockById(orderId, req)
	  .then(function(isValidStock){
	    if(!isValidStock){
	      return Promise.reject(new Error('Inventario no suficiente'));
	    }	
    	return QuotationWeb.findOne({id: orderId});
    })
		.then(function(orderFound){
			order = orderFound;

			if(!orderFound.Address){
				return Promise.reject(new Error('Asigna una dirección de envio para continuar'));
			}

			var promises = [
				getOrderCustomerInfo(order.Client),
				getOrderCustomerAddress(order.Address),
				getOrderLineItems(order.id),
			];

			return promises;
		})
		.spread(function(customerInfo, customerAddress, lineItems){
			var payments = [payment];
			var charges = getOrderCharges(order, payments);
			var discountLine = getOrderDiscountLine(order, payments);

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
					shipping_contact: customerAddress
				};

				//sails.log.info('conektaOrderParams', conektaOrderParams);
				conekta.Order.create(conektaOrderParams, function(err, res) {
					if(err){
						console.log('err conekta', err);
						return reject(err);
					}

					var conektaOrder =  res.toObject();
					console.log('ID', conektaOrder.id);
					conektaOrder.conektaId = conektaOrder.id;
					conektaOrder.QuotationWeb = orderId;
					conektaOrder.amount = convertCentsToPesos(conektaOrder.amount);
					delete conektaOrder.id;
					return resolve(ConektaOrder.create(conektaOrder));
					//return resolve(conektaOrder); 
				});

			});

		});
}

function getOrderCharges(order, orderPayments){
	orderPayments = orderPayments || [];
	var paymentGroup = OrderService.getGroupByQuotationPayments(orderPayments);
	
	return orderPayments.map(function(payment){

		var amount = order['totalPg' + paymentGroup];

		var charge = {
			//amount: convertToCents(payment.ammount),
			amount: convertToCents(amount),
			token_id: payment.cardToken,
			payment_method:{
				type: CONEKTA_PAYMENT_TYPE_CARD,
				token_id: payment.cardToken
			}
		};

		if(payment.msi){
			//charge.payment_method.type = 'default';
			charge.payment_method.monthly_installments = payment.msi
		}

		return charge;
	});
}

function getOrderDiscountLine(order, payments){
	var paymentGroup = OrderService.getGroupByQuotationPayments(payments);
	var discount = order['discountPg' + paymentGroup];

	var discountLine = {
		code: 'Descuento general',
		type: 'campaign',
		amount: convertToCents(discount || 0)
	};
	return discountLine;
}


function getOrderCustomerInfo(clientId){
	return Client.findOne({id: clientId})
		.then(function(client){
			var customerInfo = {
				name: client.CardName,
				phone: "+5215555555555",
				//phone: client.Phone1,
				//phone: user.phone,
				email: client.E_Mail
			};
			return customerInfo;
		});
}

function getOrderCustomerAddress(addressId){
	return ClientContact.findOne({id: addressId})
		.then(function(contact){
			/*
			var customerInfo = {
				name: client.CardName,
				phone: client.Phone1,
				//phone: user.phone,
				email: client.E_Mail
			};
			return customerInfo;
			*/
			var customerAddress = {
				receiver: contact.FirstName + ' ' + contact.LastName,
				phone: "+5215555555555",
				between_streets: "Placeholder streets",
				//between_streets: contact.U_Entrecalle + ' y ' + contact.U_Ycalle,
				address: {
						street1: "Placeholder street",
						//street1: contact.Address,
						city: contact.U_Ciudad,
						state: contact.U_Estado,
						postal_code: contact.U_CP,
						country: "MX"
				}					
			};
			return customerAddress;
		});
}


function getOrderLineItems(orderId){
	return QuotationDetailWeb.find({QuotationWeb: orderId}).populate('Product')
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

function convertCentsToPesos(amount){
	var pesos = amount / 100;
	return pesos;
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
