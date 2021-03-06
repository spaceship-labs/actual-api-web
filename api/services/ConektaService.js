var Promise = require('bluebird');
var conekta = require('conekta');
var moment = require('moment');
var _ = require('underscore');

var LOCAL_CURRENCY = 'MXN';
var CONEKTA_PAYMENT_TYPE_CARD = 'card';
var CONEKTA_PAYMENT_TYPE_SPEI = 'spei';

conekta.locale = 'es';
conekta.api_version = '2.0.0';


module.exports = {
	createOrder: createOrder,
	isConektaSpeiOrder: isConektaSpeiOrder,
	processNotification: processNotification,
	substractConektaLimitError: substractConektaLimitError,
	substractConektaCardProcessingError: substractConektaCardProcessingError
};

function isConektaSpeiOrder(conektaOrder){
	var speiOrder = false;
	//sails.log.info('conektaOrder', JSON.stringify(conektaOrder));
	if(conektaOrder.charges){
		var payment_method = conektaOrder.charges.data[0].payment_method;
		if(payment_method.receiving_account_number){
			speiOrder = {
				receiving_account_bank: payment_method.receiving_account_bank,
				receiving_account_number: payment_method.receiving_account_number,
				speiExpirationPayment: getTransferExportationFromUnixTime(payment_method.expires_at)
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
				//getOrderCustomerInfo(order.Client),
				getOrderCustomerInfo(payment, clientId),
				getOrderCustomerAddress(order.Address),
				getOrderLineItems(order.id),
			];

			return promises;
		})
		.spread(function(customerInfo, customerAddress, lineItems){
			var payments = [payment];
			var charges = getOrderCharges(order, payments);
			var discountLine = getOrderDiscountLine(order, payments);
			var paymentGroup = OrderService.getGroupByQuotationPayments(payments);

			var getTotalLinesAmount = function (lineItems, discountLine){
				var totalLines = lineItems.reduce(function(acum, lineItem){
					acum += (lineItem.unit_price*lineItem.quantity);
					return acum;
				},0);
				totalLines = totalLines - discountLine.amount;
				return totalLines;
			};

			//TODO: check how to match original payment amount instead of using the same order total.
			//The amount converted to cents, sometimes differs by one,for example 97914 and 97913
			var totalLinesAmount = getTotalLinesAmount(lineItems, discountLine);
			if(charges.length > 0){
				//Adding shipping fee
				charges[0].amount = totalLinesAmount + convertToCents(order['deliveryFeePg' + paymentGroup]);
			}

			return new Promise(function(resolve, reject){

				var cardCode = _.clone(customerInfo.CardCode);
				delete customerInfo.CardCode;

				var conektaOrderParams = {
					currency: LOCAL_CURRENCY,
					customer_info: customerInfo,
					line_items: lineItems,
					discount_lines: [discountLine],
					charges: charges,
					shipping_lines:[{
						amount: convertToCents(order['deliveryFeePg' + paymentGroup]),
						carrier: 'Actual Group'
					}],
					shipping_contact: customerAddress,
					metadata:{
						quotation_folio: order.folio,
						cardCode: cardCode
					}
				};

				//sails.log.info('conektaOrderParams', JSON.stringify(conektaOrderParams));
				//return reject(new Error('Fuera'));

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
		//sails.log.info('amount', amount);
		//sails.log.info('convertToCents(amount)', convertToCents(amount));
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
			charge.payment_method.monthly_installments = payment.msi;
		}

		if(payment.type === 'transfer'){
			charge.payment_method.expires_at = getTransferExpirationUnixTime(payment);
			sails.log.info('expiration unix', charge.payment_method.expires_at);
		}

		//sails.log.info('charge', charge);

		return charge;
	});
}

function getTransferExportationFromUnixTime(expirationUnixDate){
	return moment.unix(expirationUnixDate).toDate();
}

function getTransferExpirationUnixTime(payment){
	var orderDateTime = new Date();
	var paymentExpirationDateTime = moment(orderDateTime).add(12,'h');

	//Conekta manipulates time by unix format
	var paymentExpirationDateTimeUnix = paymentExpirationDateTime.unix();
	return paymentExpirationDateTimeUnix;
}

function getOrderDiscountLine(order, payments){
	var paymentGroup = OrderService.getGroupByQuotationPayments(payments);

	//Delivery fee is substracted in discount amount, delivery fee is added in "shipping_lines"
	var discount = order['discountPg' + paymentGroup];

	var discountLine = {
		code: 'Descuento general',
		type: 'campaign',
		amount: convertToCents(discount || 0)
	};
	return discountLine;
}

function getOrderCustomerInfo(payment, clientId){
	return Client.findOne({id: clientId, select:['CardCode','CardName', 'Phone1','E_Mail']})
		.then(function(client){
			return {
				name: payment.cardName || client.CardName,
				phone: payment.phone || client.Phone1,
				email: payment.email || client.E_Mail,
				CardCode: client.CardCode 
			};
		});
}

/*
function getOrderCustomerInfo(clientId){
	return Client.findOne({id: clientId})
		.then(function(client){
			var customerInfo = {
				name: client.CardName,
				phone: "+5215555555555",
				//phone: client.Phone1,
				//phone: user.phone,
				email: client.E_Mail,
				CardCode: client.CardCode
			};
			return customerInfo;
		});
}
*/

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
			/*TODO: Reestablecer valores con variables*/
			var customerAddress = {
				receiver: 'Nombre prueba',
				//receiver: contact.FirstName + ' ' + contact.LastName,
				phone: "+5215555555555",
				between_streets: "Placeholder streets",
				//between_streets: contact.U_Entrecalle + ' y ' + contact.U_Ycalle,
				address: {
						street1: "Placeholder street",
						//street1: contact.Address,
						/*
						city: contact.U_Ciudad,
						state: contact.U_Estado,
						postal_code: contact.U_CP,
						*/
						city:'Cancun',
						state: 'Quintana Roo',
						postal_code: "77500",
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

function processNotification(req, res){
  var hookLog = {
    content: JSON.stringify(req.body)
  };
  var createdHookLog;

  return HookLog.create(hookLog)
    .then(function(created){
      createdHookLog = created;
      var reqBody = req.body || {};
      var data = reqBody.data ||  false;
    	
    	res.ok();
    	return processSpeiNotification(req, createdHookLog);
    });	
}

function processSpeiNotification(req, createdHookLog){
	var reqBody = req.body || {};

  if(!reqBody || !reqBody.data){
    return Promise.resolve("No se recibio el formato correcto");
  }

  console.log('hook type:', reqBody.type);

  if(reqBody.type !== 'charge.paid'){
  	return Promise.resolve("No es una notification de pago");
  }

  var reqData = reqBody.data;
  var conektaOrderId = reqData.object.order_id;
  var status = reqData.object.status;
  var payment_method = reqData.object.payment_method;
  var conektaOrderPromise;
  var order;
  var quotationWithErr;
  var errLog;

  if(payment_method.type != "spei"){
  	return Promise.resolve("No es una notification de pago SPEI");  	
  }

  if(status!== 'paid'){
    return Promise.resolve("No se encontro la orden");
  }

  sails.log.info('Spei notification ' + conektaOrderId);

  return OrderWeb.findOne({conektaId:conektaOrderId})
    .populate('UserWeb')
    .populate('Client')
    .populate('Address')
    .populate('Payments')
	  .then(function(_order){

	  		if(!_order){
					return Promise.resolve("No se encontro la orden");  			
	  		}
	  		order = _order;

	      var orderId = order.id;
        return OrderDetailWeb.find({OrderWeb: orderId}).populate('Product');
	    })
	    .then(function(details){
	      var orderDetails = details;

	      sails.log.info('Relating order ' + order.id +' to sap via spei notification: ' + createdHookLog.id);
	      order.hookLogId = createdHookLog.id;
	      order.relatingViaConektaNotification = true;
	      return OrderService.relateOrderToSap(order, orderDetails, req);
	    })
	    .then(function(related){
	    	sails.log.info('Sending order ' + order.id + ' email notification after spei pay');
	    	//return Promise.resolve('Done');
	    	return [
		    	Email.sendOrderConfirmation(order.id),
		    	InvoiceService.createOrderInvoice(order.id)
		    ];
	    })
	    .spread(function(email, invoice){
	    	sails.log.info('Invoice genereated', invoice);
	    	return Promise.resolve();
	    })
      .catch(function(err){
        console.log('catch conekta notification',err);
        errLog = err;
        
        sails.log.info('start finding quotationWithErr', order.QuotationWeb);
        if(!order){
        	return Promise.reject(errLog);
        }

        return QuotationWeb.findOne({id: order.QuotationWeb, select:['folio']})
          .populate('Client')
          .populate('Store');
      })
      .then(function(quotationWithErr){

        sails.log.info('quotationWithErr folio', (quotationWithErr || {}).folio);

        if(quotationWithErr && errLog){
          var client = quotationWithErr.Client || {};
          var formArr = [
            {label:'Folio', value:quotationWithErr.folio},
            {label:'Id', value: quotationWithErr.id},
            {label:'Cliente ID', value: client.CardCode},
            {label:'Cliente Nombre', value: client.CardName},
            {label:'Cliente Email', value: client.E_Mail},
            {label:'Cliente Telefono', value: client.Phone1},

            {label:'Log', value: JSON.stringify(errLog)}

          ];

          Email.sendQuotationLog(formArr, quotationWithErr.Store, function(){
            sails.log.info('Log de error enviado');
          });

          return Promise.reject(errLog);
        }

      });

}

function substractConektaLimitError(err){
	var RATE_LIMIT_ERROR_CODE = 'conekta.errors.parameter_validation.combo.order.currency_type.card.maximum';
	if(!err){
		return false;
	}

	if(err.details && err.object === 'error'){
		if (err.details.length > 0){
			var limitErrorThrown = _.some(err.details, function(detailErr){
				var detailErrCode = (detailErr || {}).code;
				return (detailErrCode === RATE_LIMIT_ERROR_CODE);
			});
			return limitErrorThrown;
		}
	}

	return false;
}

function substractConektaCardProcessingError(err){
	var PROCESSING_ERR_TYPE = 'processing_error';
	if(!err){
		return false;
	}

	return (err.type === PROCESSING_ERR_TYPE && err.object === 'error');
}