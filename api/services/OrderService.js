var _ = require('underscore');
var Promise = require('bluebird');
var moment = require('moment');

var EWALLET_POSITIVE = 'positive';
var INVOICE_SAP_TYPE = 'Invoice';
var ORDER_SAP_TYPE = 'Order';
var ERROR_SAP_TYPE = 'Error';
var BALANCE_SAP_TYPE = 'Balance';

module.exports = {
  createFromQuotation: createFromQuotation,
  getGroupByQuotationPayments: getGroupByQuotationPayments,
  relateOrderToSap: relateOrderToSap,
  getOrderStatusMapper: getOrderStatusMapper,
  getOrderStatusLabel: getOrderStatusLabel
};

function getOrderStatusMapper(){
  var statusMap = {
    'pending': 'Pendiente',
    'completed': 'Procesado',
    'pending-sap': 'Procesado',
    //'pending-sap': 'Pagado y procesando',
    //'completed': 'Pagado',
    'pending-payment': 'Pendiente de pago',
    'cancelled': 'Cancelado'
  };        
  return statusMap;
}

function getOrderStatusLabel(status){
  var statusMap = getOrderStatusMapper();
  return statusMap[status] || status;
}

function getGroupByQuotationPayments(payments){
  var group = 1;
  if(payments.length > 0){
    var paymentsCount = payments.length;
    group = payments[paymentsCount - 1].group;
  }
  return group;
}

function createFromQuotation(form, req){
  var clientId = UserService.getCurrentUserClientId(req);
  var quotationId = form.quotationId;
  var payment = form.payment;
  var conektaOrder;

  var promises = [
    ConektaOrder.findOne({QuotationWeb: quotationId, Client: clientId}),
    PaymentWeb.findOne({QuotationWeb:quotationId, Client: clientId})
  ];

  return Promise.all(promises)
    .then(function(results){

      var conektaOrderFound = results[0];
      var paymentFound = results[0];

      if(!conektaOrderFound && !paymentFound){
        return createConektaOrderAndPayment(quotationId, payment, req)
          .then(function(_conektaOrder){
            form.conektaOrder = _conektaOrder;
            return createOrder(form, req);
          });
      }

      else if(conektaOrderFound && !paymentFound){
        console.log('creando el pago');
        return PaymentService.addPayment(form.payment, quotationId, req)
          .then(function(paymentCreated){
            form.conektaOrder = conektaOrderFound;
            return createOrder(form, req);
          });
      }

      else{
        sails.log.info('directo a createorder');
        form.conektaOrder = conektaOrderFound;
        return createOrder(form, req);
      }
    });
}

function createConektaOrderAndPayment(quotationId, payment, req){
  var conektaOrder;
  return ConektaService.createOrder(quotationId, payment, req)
    .then(function(conektaOrder){
      return conektaOrder;
    })
    .then(function(_conektaOrder){
      conektaOrder = _conektaOrder;
      payment.stockValidated = true;
      return PaymentService.addPayment(payment, quotationId, req);
    })
    .then(function(paymentCreated){
      return conektaOrder;
    });
}

function createOrder(form, req){
  //return Promise.reject(new Error("Break"));

  var quotationId  = form.quotationId;
  var options         = {
    updateDetails: true,
    currentStoreId: req.activeStore.id
  };
  var orderCreated = false;
  var SlpCode      = -1;
  var currentStore = req.activeStore;
  var quotation;
  var orderToCreate;
  var orderDetails;

  //Validating if quotation doesnt have an order assigned
  return OrderWeb.findOne({QuotationWeb: quotationId})
    .then(function(order){
      if(order){
        return Promise.reject(
          new Error('Ya se ha creado un pedido sobre esta cotización')
        );
      }
      return [
          StockService.validateQuotationStockById(quotationId, req),
          PaymentWeb.find({QuotationWeb: quotationId}).sort('createdAt ASC')
        ];
    })
    .spread(function(isValidStock, quotationPayments){
      if(!isValidStock){
        return Promise.reject(
          new Error('Inventario no suficiente para crear la orden')
        );
      }
      options.paymentGroup = getGroupByQuotationPayments(quotationPayments);
      var calculator = QuotationService.Calculator();
      return calculator.updateQuotationTotals(quotationId, options);
    })
    .then(function(updatedQuotationResult){

      return QuotationWeb.findOne({id: quotationId})
        .populate('Payments')
        .populate('Details')
        .populate('Address')
        .populate('UserWeb')
        .populate('Client');
    })
    .then(function(quotationFound){
      quotation = quotationFound;

      if(quotation.OrderWeb){
        return Promise.reject(
          new Error('Ya se ha creado un pedido sobre esta cotización')
        );
      }

      if(!quotation.Details || quotation.Details.length === 0){
        return Promise.reject(
          new Error('No hay productos en esta cotización')
        );
      }

      SlpCode = -1;

      var paymentsIds = quotation.Payments.map(function(p){return p.id;});
      orderToCreate = {
        ammountPaid: quotation.ammountPaid,
        CardCode: quotation.Client.CardCode,
        CardName: quotation.Client.CardName,
        Client: quotation.Client.id,
        UserWeb: quotation.UserWeb.id,
        discount: quotation.discount,
        paymentGroup: options.paymentGroup,
        Payments: paymentsIds,
        QuotationWeb: quotationId,
        SlpCode: SlpCode,
        source: quotation.source,
        Store: options.currentStoreId,
        subtotal: quotation.subtotal,
        total: quotation.total,
        totalProducts: quotation.totalProducts,
      };

      var minPaidPercentage = 100;
      if( getPaidPercentage(quotation.ammountPaid, quotation.total) < minPaidPercentage){
        return Promise.reject(
          new Error('No se ha pagado la cantidad minima de la orden')
        );
      }
      if(minPaidPercentage < 100){
        orderToCreate.status = 'minimum-paid';
      }else{
        orderToCreate.status = 'pending-sap';
      }

      if( form.conektaOrder.isSpeiOrder ){
        orderToCreate.status = 'pending-payment';
        orderToCreate.isSpeiOrder = true;
      }

      if(quotation.Address){
        orderToCreate.Address = _.clone(quotation.Address.id);
        orderToCreate.address = _.clone(quotation.Address.Address);
        orderToCreate.CntctCode = _.clone(quotation.Address.CntctCode);

        delete quotation.Address.id;
        delete quotation.Address.Address; //Address field in person contact
        delete quotation.Address.createdAt;
        delete quotation.Address.updatedAt;
        delete quotation.Address.CntctCode;
        delete quotation.Address.CardCode;
        orderToCreate = _.extend(orderToCreate,quotation.Address);
      }

      orderToCreate.ConektaOrderId = form.conektaOrder.conektaId;
      orderToCreate.ConektaPaymentStatus = form.conektaOrder.payment_status;
      orderToCreate.ConektaOrder = form.conektaOrder;
      orderToCreate.conektaId = form.conektaOrder.conektaId;
      orderToCreate.receiving_account_bank = form.conektaOrder.receiving_account_bank || false;
      orderToCreate.receiving_account_number = form.conektaOrder.receiving_account_number || false;
      orderToCreate.conektaAmount = form.conektaOrder.amount;
      orderToCreate.speiExpirationPayment = form.conektaOrder.speiExpirationPayment;

      if( orderToCreate.speiExpirationPayment && orderToCreate.speiExpirationPayment instanceof Date /*&& moment(orderToCreate.speiExpirationPayment).isValid()*/  ){
        var HOURS_TO_SEND_REMIND = 6;
        var TIME_LAPSE = 'hours';
        //var HOURS_TO_SEND_REMIND = 715;
        //var TIME_LAPSE = 'minutes';        
        orderToCreate.speiExpirationReminderStartDate = moment(orderToCreate.speiExpirationPayment).subtract(HOURS_TO_SEND_REMIND, TIME_LAPSE).toDate();
        console.log('speiExpirationReminderStartDate', orderToCreate.speiExpirationReminderStartDate);
      }

      return OrderWeb.create(orderToCreate);
    })
    .then(function(created){
      orderCreated = created;
      return OrderWeb.findOne({id:created.id}).populate('Details');
    })
    .then(function(orderFound){
      //Cloning quotation details to order details
      quotation.Details.forEach(function(detail){
        detail.QuotationDetailWeb = _.clone(detail.id);
        delete detail.id;

        detail.inSapWriteProgress = true;
        if(orderFound.isSpeiOrder){
          detail.isSpeiOrderDetail = true;
          detail.speiExpirationPayment = form.conektaOrder.speiExpirationPayment;
        }

        orderFound.Details.add(detail);
      });
      return orderFound.save();
    })
    .then(function(){
      var updateFields = {
        OrderWeb: orderCreated.id,
        status: 'to-order',
        isClosed: true,
        isClosedReason: 'Order created'
      };

      return QuotationWeb.update({id:quotation.id} , updateFields);
    })
    .then(function(quotationUpdated){
      orderCreated = orderCreated.toObject();
      orderCreated.Details = orderDetails;
      return orderCreated;
    });
}

//@params
//order: Populated with:
// *Client
// *Address
// *Payments

//orderDetails: Populated with:
// *Product
function relateOrderToSap(order, orderDetails,req){
  var SlpCode = -1;
  var error;
  var clientId = UserService.getCurrentUserClientId(req);
  var userId = UserService.getCurrentUserId(req);

  //sails.log.info('relatingViaConektaNotification', order.relatingViaConektaNotification);

  //return Promise.reject(new Error('Error forzado sap'));

  if(order.status === 'pending-payment' && !order.relatingViaConektaNotification){
    console.log('Pedido pendiente por pagar ' + order.id);
    return Promise.resolve('Pedido pendiente por pagar');
  }

  var promises = [
    Site.findOne({handle:'actual-group'}),
    OrderWeb.update({id:order.id}, {inSapWriteProgress: true})
  ];
  
  return new Promise(function(resolve, reject){
      Promise.all(promises)
      .then(function(results){
        var site = results[0];

        var sapOrderParams = {
          quotationId:      order.QuotationWeb,
          groupCode:        req.activeStore.GroupCode,
          cardCode:         order.Client.CardCode,
          slpCode:          SlpCode,
          cntctCode:        order.Address.CntctCode,
          payments:         order.Payments,
          exchangeRate:     site.exchangeRate,
          currentStore:     req.activeStore,
          quotationDetails: orderDetails
        };

        return SapService.createSaleOrder(sapOrderParams);
      })
      .then(function(sapResponseAux){
        sapResponse = sapResponseAux.response;
        var sapEndpoint = decodeURIComponent(sapResponseAux.endPoint);
        sails.log.info('createSaleOrder response', sapResponse);
        var log = {
          content: sapEndpoint + '\n' +  JSON.stringify(sapResponse),
          Client   : clientId,
          UserWeb: userId,
          Store  : req.activeStore.id,
          QuotationWeb: order.QuotationWeb
        };
        return SapOrderConnectionLogWeb.create(log);
      })
      .then(function(sapLogCreated){
        sapLog = sapLogCreated;

        sapResult = JSON.parse(sapResponse.value);
        var isValidSapResponse = isValidOrderCreated(sapResponse, sapResult, order.Payments);
        if( isValidSapResponse.error ){
          var defaultErrMsg = 'Error en la respuesta de SAP';
          var errorStr = isValidSapResponse.error || defaultErrMsg;
          if(errorStr === true){
            errorStr = defaultErrMsg;
          }
          return Promise.reject(new Error(errorStr));
        }

        return saveOrderSapReferences(sapResult, order, orderDetails);
      })
      .then(function(){
        return [
          OrderWeb.update({id: order.id},{status:'completed', inSapWriteProgress:false}),
          OrderDetailWeb.update({OrderWeb:order.id},{inSapWriteProgress: false}),
          StockService.syncOrderDetailsProducts(orderDetails)
        ];
      })
      .spread(function(updateOrder, updateDetails, syncResults){
        sails.log.info('syncResults', syncResults);
        resolve(updateOrder);        
      })
      .catch(function(err){
        error = err;
        console.log('err relateOrderToSap', err);
        var params = {inSapWriteProgress:false};
        if(order.hookLogId){
          params.HookLog = order.hookLogId; 
        }
        return OrderWeb.update({id: order.id}, params);
      })
      .then(function(updated){
        reject(error);
      });
  });
}

function isValidOrderCreated(sapResponse, sapResult, paymentsToCreate){
  sapResult = sapResult || {};
  if( sapResponse && _.isArray(sapResult)){

    if(sapResult.length <= 0){
      return {
        error: 'No fue posible crear el pedido en SAP'
      };
    }

    var sapResultWithBalance = _.clone(sapResult);
    sapResult = sapResult.filter(function(item){
      return item.type !== BALANCE_SAP_TYPE;
    });

    //If only balance was returned
    if(sapResult.length === 0){
      return {
        error: 'Documentos no generados en SAP'
      };
    }

    var everyOrderHasPayments = sapResult.every(function(sapOrder){
      return checkIfSapOrderHasPayments(sapOrder, paymentsToCreate);
    });

    var everyOrderHasFolio    = sapResult.every(checkIfSapOrderHasReference);

    sails.log.info('everyOrderHasFolio', everyOrderHasFolio);
    sails.log.info('everyOrderHasPayments', everyOrderHasPayments);

    if(!everyOrderHasFolio){
      return {
        error:collectSapErrors(sapResult) || true
      };
    }
    else if(everyOrderHasPayments && everyOrderHasFolio){
      return {
        error: false
      };
    }

    var clientBalance = extractBalanceFromSapResult(sapResultWithBalance);
    if(!clientBalance || isNaN(clientBalance) ){
      return {
        error: 'Balance del cliente no definido en la respuesta'
      };
    }

  }
  return {
    error: true
  };
}

function collectSapErrors(sapResult){
  var sapErrorsString = '';
  if(_.isArray(sapResult) ){
    var sapErrors =  sapResult.map(collectSapErrorsBySapOrder);
    sapErrorsString = sapErrors.join(', ');
  }
  return sapErrorsString;
}

function collectSapErrorsBySapOrder(sapOrder){
  if(sapOrder.type === ERROR_SAP_TYPE){
    return sapOrder.result;
  }
  return null;
}

function checkIfSapOrderHasReference(sapOrder){
  return sapOrder.result &&
    (
      sapOrder.type === INVOICE_SAP_TYPE ||
      sapOrder.type === ORDER_SAP_TYPE
    );
}

function checkIfSapOrderHasPayments(sapOrder, paymentsToCreate){
  if( _.isArray(sapOrder.Payments) ){

    //No payments are returned when using only client balance or credit
    console.log('everyPaymentIsClientBalanceOrCredit(paymentsToCreate)', everyPaymentIsClientBalanceOrCredit(paymentsToCreate));

    /*paymentsToCreate = paymentsToCreate.filter(function(){

    })*/

    if(everyPaymentIsClientBalanceOrCredit(paymentsToCreate)){
      return true;
    }

    if(sapOrder.Payments.length > 0){
      return sapOrder.Payments.every(function(payment){
        return !isNaN(payment.pay) && payment.reference;
      });
    }
  }

  return false;
}

function everyPaymentIsClientBalanceOrCredit(paymentsToCreate){
  var everyPaymentIsClientBalance = paymentsToCreate.every(function(p){
    return p.type === PaymentService.CLIENT_BALANCE_TYPE || p.type === PaymentService.CLIENT_CREDIT_TYPE;
  });
  return everyPaymentIsClientBalance;
}


function saveOrderSapReferences(sapResult, order, orderDetails){
  var clientBalance = parseFloat(extractBalanceFromSapResult(sapResult));
  var clientId = order.Client.id || order.Client;


  sapResult = sapResult.filter(function(item){
    return item.type !== BALANCE_SAP_TYPE;
  });

  var ordersSap = sapResult.map(function(orderSap){

    var orderSapReference = {
      OrderWeb: order.id,
      invoiceSap: orderSap.Invoice || null,
      document: orderSap.Order,
      PaymentsSapWeb: orderSap.Payments.map(function(payment){
        return {
          document: payment.pay,
          PaymentWeb: payment.reference
        };
      }),
    };

    if(orderSap.type === INVOICE_SAP_TYPE){
      orderSapReference.invoiceSap = orderSap.result;
    }
    else if(orderSap.type === ORDER_SAP_TYPE){
      orderSapReference.document = orderSap.result;
    }

    if(orderSap.series && _.isArray(orderSap.series)){
      orderSapReference.ProductSeries = orderSap.series.map(function(serie){
        var productSerie =  {
          QuotationDetailWeb: serie.DetailId,
          OrderDetailWeb: _.findWhere(orderDetails, {QuotationDetailWeb: serie.DetailId}),
          seriesNumbers: serie.Number
        };
        return productSerie;
      });
    }

    return orderSapReference;
  });

  return Promise.join(
    OrderSapWeb.create(ordersSap),
    Client.update({id:clientId},{Balance: clientBalance})
  );
}

function extractBalanceFromSapResult(sapResult){
  var balanceItem = _.findWhere(sapResult, {type: BALANCE_SAP_TYPE});
  if(balanceItem){
    return balanceItem.result;
  }
  return false;
}


//@params
/*
  params: {
    Details (array of objects),
    storeId
    orderId
    quotationId,
    userId (object),
    Client (object)
  }
*/
function processEwalletBalance(params){
  var ewalletRecords = [];
  var generated = 0;
  for(var i=0;i < params.details.length; i++){
    generated += params.details[i].ewallet || 0;
    if( (params.details[i].ewallet || 0) > 0){
      ewalletRecords.push({
        Store: params.storeId,
        Order: params.orderId,
        Quotation: params.quotationId,
        QuotationDetail: params.details[i].id,
        User: params.userId,
        Client: params.Client.id,
        amount: params.details[i].ewallet,
        type:'positive'
      });
    }
  }

  var clientBalance = (params.client.ewallet || 0) + generated;
  return Client.update({id:params.clientId},{ewallet:generated})
    .then(function(clientUpdated){
      return Promise.each(ewalletRecords, createEwalletRecord);
    });
}

function createEwalletRecord(record){
  return EwalletRecord.create(record);
}

function getPaidPercentage(amountPaid, total){
  var percentage = amountPaid / (total / 100);
  return percentage;
}
