var Promise = require('bluebird');
var conekta = require('conekta');
var LOCAL_CURRENCY = 'MXN';
var CONEKTA_PAYMENT_TYPE_CARD = 'card';
var CONEKTA_PAYMENT_TYPE_SPEI = 'spei';

conekta.locale = 'es';
conekta.api_version = '2.0.0';


module.exports = {
	createOrder: createOrder,
	isConektaSpeiOrder: isConektaSpeiOrder,
	processNotification: processNotification
};

function isConektaSpeiOrder(conektaOrder){
	var speiOrder = false;
	if(conektaOrder.charges){
		var payment_method = conektaOrder.charges.data[0].payment_method;
		if(payment_method.receiving_account_number){
			speiOrder = {
				receiving_account_bank: payment_method.receiving_account_bank,
				receiving_account_number: payment_method.receiving_account_number
			};
		}
	}
	return speiOrder;
}


function createOrder(orderId, payment, req) {
	conekta.api_key = SiteService.getConektaKeyBySite(req);
	//sails.log.info('req.headers.site', req.headers.site);
	//sails.log.info('api_key', conekta.api_key);
	var order;
	var userId = UserService.getCurrentUserId(req);
	var clientId = UserService.getCurrentUserClientId(req);

	return StockService.validateQuotationStockById(orderId, req)
	  .then(function(isValidStock){
	    if(!isValidStock){
	      return Promise.reject(new Error('Inventario no suficiente'));
	    }
    	return QuotationWeb.findOne({id: orderId, Client: clientId});
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

			var getTotalLinesAmount = function (lineItems, discountLine){
				var totalLines = lineItems.reduce(function(acum, lineItem){
					acum += (lineItem.unit_price*lineItem.quantity);
					return acum;
				},0);
				totalLines = totalLines - discountLine.amount;
				return totalLinesAmount;
			};

			//TODO: check how to match original payment amount instead of using the same order total.
			//The amount converted to cents, sometimes differs by one,for example 97914 and 97913
			var totalLinesAmount = getTotalLinesAmount(lineItems, discountLine);
			if(charges.length > 0){
				charges[0].amount = totalLinesAmount;
			}

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

				conekta.Order.create(conektaOrderParams, function(err, res) {
					if(err){
						console.log('err conekta', err);
						return reject(err);
					}

					var conektaOrder =  res.toObject();

					console.log('conekta order ID', conektaOrder.id);
					conektaOrder.conektaId = conektaOrder.id;
					conektaOrder.requestData = JSON.stringify(conektaOrderParams);
					conektaOrder.responseData = JSON.stringify(conektaOrder);
					conektaOrder.QuotationWeb = orderId;
					conektaOrder.UserWeb = userId;

					var speiOrder = isConektaSpeiOrder(conektaOrder);
					if(speiOrder){
						conektaOrder.isSpeiOrder = true;
						conektaOrder = _.extend(conektaOrder, speiOrder);
					}

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
		var type = (payment.type === 'transfer') ? CONEKTA_PAYMENT_TYPE_SPEI : CONEKTA_PAYMENT_TYPE_CARD;

		var charge = {
			//amount: convertToCents(payment.ammount),
			amount: convertToCents(amount),
			token_id: payment.cardToken,
			payment_method:{
				type: type,
			}
		};

		if(payment.type !== 'transfer'){
			charge.payment_method.token_id = payment.cardToken;
		}

		if(payment.msi){
			//charge.payment_method.type = 'default';
			charge.payment_method.monthly_installments = payment.msi;
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

function processNotification(req){
  var hookLog = {
    content: JSON.stringify(req.body)
  };
  var createdHook;

  return HookLog.create(hookLog)
    .then(function(created){
      createdHook = created;
      var reqBody = req.body || {};
      var data = reqBody.data ||  false;
    	
    	return processSpeiNotification(reqData);
    });	
}

function processSpeiNotification(reqData){

  if(!reqData){
    return Promise.reject(new Error("No se recibio el formato correcto"));
  }

  if(reqData.type !== 'charge.paid'){
  	return Promise.reject(new Error("No es una notification de pago"));
  }

  var conektaOrderId = reqData.object.order_id;
  var status = reqData.object.status;
  var payment_method = reqData.object.payment_method;
  var conektaOrderPromise;
  var order;

  if(payment_method.type != "spei"){
  	return Promise.reject(new Error("No es una notification de pago SPEI"));  	
  }

  if(status === 'paid'){
    conektaOrderPromise = ConektaOrder.findOne({conektaId:conektaOrderId});
  }else{
    return Promise.reject(new Error("No se encontro la orden"));
  }

  sails.log.info('Spei notification ' + conektaOrderId);

  return conektaOrderPromise
  .then(function(conektaOrder){
      var orderId = conektaOrder.OrderWeb;

      var promises = [
        OrderWeb.findOne({id: orderId})
          .populate('UserWeb')
          .populate('Client')
          .populate('Address')
          .populate('Payments'),
        OrderDetailWeb.find({OrderWeb: orderId}).populate('Product')
      ];

      return Promise.all(promises);       
    })
    .then(function(results){
      order = results[0];
      var orderDetails = results[1];

      if(!order){
        return Promise.reject(new Error('No se encontro el pedido'));
      }

      sails.log.info('Relating order to sap via spei notification: ' + createdHook.id);
      order.hookLogId = createdHook.id;
      return OrderService.relateOrderToSap(order, orderDetails, req);
    })
    .then(function(related){
    	return Email.sendOrderConfirmation(order.id);
    }) ;
 }