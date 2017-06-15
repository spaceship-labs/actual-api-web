var _ = require('underscore');
var Promise = require('bluebird');

var EWALLET_POSITIVE = 'positive';
var INVOICE_SAP_TYPE = 'Invoice';
var ORDER_SAP_TYPE = 'Order';
var ERROR_SAP_TYPE = 'Error';
var BALANCE_SAP_TYPE = 'Balance';

module.exports = {
  createFromQuotation: createFromQuotation,
  createFromQuotation2: createFromQuotation2,
  getCountByUser: getCountByUser,
  getTotalsByUser: getTotalsByUser
};



function getCountByUser(form){
  var userId = form.userId;
  var fortNightRange = Common.getFortnightRange();

  //Fortnight range by default
  var startDate = form.startDate || fortNightRange.start;
  var endDate = form.endDate || fortNightRange.end;
  var queryDateRange = {
    User: userId,
    createdAt: { '>=': startDate, '<=': endDate }
  };
  var queryfortNightRange = {
    User: userId,
    createdAt: { '>=': fortNightRange.start, '<=': fortNightRange.end }
  };

  return Promise.join(
    OrderWeb.count(queryfortNightRange),
    OrderWeb.count(queryDateRange)
  )
    .then(function(results){
      var response = {
        fortnight: results[0],
        dateRange: results[1]
      };
      return response;
    });

}

function getTotalsByUser(form){
  var userId = form.userId;
  var getFortnightTotals = !_.isUndefined(form.fortnight) ? form.fortnight : true;
  var fortNightRange = Common.getFortnightRange();

  //Fortnight range by default
  var startDate = form.startDate || fortNightRange.start;
  var endDate = form.endDate || fortNightRange.end;
  var queryDateRange = {
    User: userId,
    createdAt: { '>=': startDate, '<=': endDate }
  };
  var queryfortNightRange = {
    User: userId,
    createdAt: { '>=': fortNightRange.start, '<=': fortNightRange.end }
  };

  var props = {
    totalDateRange: OrderWeb.find(queryDateRange).sum('total')
  };
  if(getFortnightTotals){
    props.totalFortnight = OrderWeb.find(queryfortNightRange).sum('total');
  }

  //Find all totals
  return Promise.props(props)
    .then(function(result){
      var totalFortnight = 0;
      var totalDateRange = 0;
      if(getFortnightTotals && result.totalFortnight.length > 0){
        totalFortnight = result.totalFortnight[0].total;
      }
      if(result.totalDateRange.length > 0){
        totalDateRange = result.totalDateRange[0].total;
      }
      var response = {
        fortnight: totalFortnight || false,
        dateRange: totalDateRange
      };
      return response;
    });

}

function getGroupByQuotationPayments(payments){
  var group = 1;
  if(payments.length > 0){
    var paymentsCount = payments.length;
    group = payments[paymentsCount - 1].group;
  }
  return group;
}

function createFromQuotation2(form, req){
  var quotationId = form.quotationId;
  var payment = form.payment;
  var conektaOrder;

  return ConektaService.createOrder(quotationId, payment, req)
    .then(function(conektaOrder){
      sails.log.info('conektaOrder', conektaOrder);
      return conektaOrder;
    })
    .then(function(_conektaOrder){
      conektaOrder = _conektaOrder;
      return PaymentService.addPayment(form.payment, quotationId, req);
    })
    .then(function(paymentCreted){
      console.log('paymentcreated', paymentCreted);
      form.conektaOrder = conektaOrder;
      return createFromQuotation(form, req);
    })
}

function createFromQuotation(form, req){
  var quotationId  = form.quotationId;
  var opts         = {
    updateDetails: true,
    currentStoreId: req.activeStore.id
  };
  var orderCreated = false;
  var SlpCode      = -1;
  var currentStore = req.activeStore;
  var sapResponse;
  var sapResult;
  var quotation;
  var orderParams;
  var orderDetails;
  var sapLog;

  //Validating if quotation doesnt have an order assigned
  return OrderWeb.findOne({Quotation: quotationId})
    .then(function(order){
      if(order){
        var frontUrl = process.env.baseURLFRONT || 'http://ventas.miactual.com';
        var orderUrl = frontUrl + '/checkout/order/' + order.id;
        return Promise.reject(
          new Error('Ya se ha creado un pedido sobre esta cotización : ' + orderUrl)
        );
      }
      return [
          StockService.validateQuotationStockById(quotationId, req),
          PaymentWeb.find({Quotation: quotationId}).sort('createdAt ASC')
        ];
    })
    .spread(function(isValidStock, quotationPayments){
      if(!isValidStock){
        return Promise.reject(
          new Error('Inventario no suficiente para crear la orden')
        );
      }
      opts.paymentGroup = getGroupByQuotationPayments(quotationPayments);

      var calculator = QuotationService.Calculator();
      return calculator.updateQuotationTotals(quotationId, opts);
    })
    .then(function(updatedQuotationResult){
      return QuotationWeb.findOne({id: quotationId})
        .populate('Payments')
        .populate('Details')
        .populate('Address')
        .populate('User')
        .populate('Client');
    })
    .then(function(quotationFound){
      quotation = quotationFound;

      if(quotation.Order){
        var frontUrl = process.env.baseURLFRONT || 'http://ventas.miactual.com';
        var orderUrl = frontUrl + '/checkout/order/' + quotation.Order;
        return Promise.reject(
          new Error('Ya se ha creado un pedido sobre esta cotización : ' + orderUrl)
        );
      }

      if(!quotation.Details || quotation.Details.length === 0){
        return Promise.reject(
          new Error('No hay productos en esta cotización')
        );
      }

      SlpCode = -1;

      var paymentsIds = quotation.Payments.map(function(p){return p.id;});
      orderParams = {
        source: quotation.source,
        ammountPaid: quotation.ammountPaid,
        total: quotation.total,
        subtotal: quotation.subtotal,
        discount: quotation.discount,
        paymentGroup: opts.paymentGroup,
        groupCode: req.activeStore.GroupCode,
        totalProducts: quotation.totalProducts,
        Client: quotation.Client.id,
        CardName: quotation.Client.CardName,
        Quotation: quotationId,
        Payments: paymentsIds,
        ClientBalanceRecords: quotation.ClientBalanceRecords,
        CardCode: quotation.Client.CardCode,
        SlpCode: SlpCode,
        Store: opts.currentStoreId,
        ConektaOrderId: form.conektaOrder.id,
        ConektaPaymentStatus: form.conektaOrder.payment_status
        //Store: user.activeStore
      };

      var minPaidPercentage = quotation.minPaidPercentage || 100;
      
      if( getPaidPercentage(quotation.ammountPaid, quotation.total) < minPaidPercentage){
        return Promise.reject(
          new Error('No se ha pagado la cantidad minima de la orden')
        );
      }
      if(minPaidPercentage < 100){
        orderParams.status = 'minimum-paid';
      }else{
        orderParams.status = 'paid';
      }
      
      if(quotation.Address){
        orderParams.Address = _.clone(quotation.Address.id);
        orderParams.address = _.clone(quotation.Address.Address);
        orderParams.CntctCode = _.clone(quotation.Address.CntctCode);

        delete quotation.Address.id;
        delete quotation.Address.Address; //Address field in person contact
        delete quotation.Address.createdAt;
        delete quotation.Address.updatedAt;
        delete quotation.Address.CntctCode;
        delete quotation.Address.CardCode;
        orderParams = _.extend(orderParams,quotation.Address);
      }

      return [
        QuotationDetailWeb.find({QuotationWeb: quotation.id})
          .populate('Product'),
        Site.findOne({handle:'actual-group'})
      ];
    })
    .spread(function(quotationDetails, site){
      return SapService.createSaleOrder({
        quotationId:      quotationId,
        groupCode:        orderParams.groupCode,
        cardCode:         orderParams.CardCode,
        slpCode:          SlpCode,
        cntctCode:        orderParams.CntctCode,
        payments:         quotation.Payments,
        exchangeRate:     site.exchangeRate,
        currentStore:     currentStore,
        quotationDetails: quotationDetails
      });
    })
    .then(function(sapResponseAux){
      sapResponse = sapResponseAux.response;
      var sapEndpoint = decodeURIComponent(sapResponseAux.endPoint);
      sails.log.info('createSaleOrder response', sapResponse);
      var log = {
        content: sapEndpoint + '\n' +  JSON.stringify(sapResponse),
        Client   : req.user.id,
        Store  : opts.currentStoreId,
        QuotationWeb: quotationId
      };
      return SapOrderConnectionLogWeb.create(log);
    })  
    .then(function(sapLogCreated){
      sapLog = sapLogCreated;

      sapResult = JSON.parse(sapResponse.value);
      var isValidSapResponse = isValidOrderCreated(sapResponse, sapResult, quotation.Payments);
      if( isValidSapResponse.error ){
        var defaultErrMsg = 'Error en la respuesta de SAP';
        var errorStr = isValidSapResponse.error || defaultErrMsg;
        if(errorStr === true){
          errorStr = defaultErrMsg;
        }
        return Promise.reject(new Error(errorStr));
      }
      orderParams.documents = sapResult;
      orderParams.SapOrderConnectionLogWeb = sapLog.id;
      form.conektaOrder.conektaId = _.clone(form.conektaOrder.id);
      delete form.conektaOrder.id;
      orderParams.ConektaOrder = form.conektaOrder;
      orderParams.conektaToken = form.conektaOrder.conektaId;

      return OrderWeb.create(orderParams);
    })
    .then(function(created){
      orderCreated = created;
      return OrderWeb.findOne({id:created.id}).populate('Details');
    })
    .then(function(orderFound){
      //Cloning quotation details to order details
      quotation.Details.forEach(function(d){
        d.QuotationDetailWeb = _.clone(d.id);
        delete d.id;
        orderFound.Details.add(d);
      });
      return orderFound.save();
    })
    .then(function(){
      return OrderDetailWeb.find({OrderWeb: orderCreated.id})
        .populate('Product')
        .populate('shipCompanyFrom');
    })
    .then(function(orderDetailsFound){
      orderDetails = orderDetailsFound;
      //return StockService.substractProductsStock(orderDetails);
      
      var updateFields = {
        OrderWeb: orderCreated.id,
        status: 'to-order',
        isClosed: true,
        isClosedReason: 'Order created'
      };
      return [
        QuotationWeb.update({id:quotation.id} , updateFields),
        saveSapReferences(sapResult, orderCreated, orderDetails)
      ];
    })
    .spread(function(quotationUpdated, sapOrdersReference){
      var params = {
        details: quotation.Details,
        storeId: opts.currentStoreId,
        orderId: orderCreated.id,
        quotationId: quotation.id,
        client: quotation.Client
      };
      /*
      return processEwalletBalance(params);
    })  
    .then(function(){
    */
      orderCreated = orderCreated.toObject();
      orderCreated.Details = orderDetails;
      return orderCreated;
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


function saveSapReferences(sapResult, order, orderDetails){
  var clientBalance = parseFloat(extractBalanceFromSapResult(sapResult));
  var clientId = order.Client.id || order.Client;


  sapResult = sapResult.filter(function(item){
    return item.type !== BALANCE_SAP_TYPE;
  });

  var ordersSap = sapResult.map(function(orderSap){

    var orderSapReference = {
      Order: order.id,
      invoiceSap: orderSap.Invoice || null,
      document: orderSap.Order,
      PaymentsSap: orderSap.Payments.map(function(payment){
        return {
          document: payment.pay,
          Payment: payment.reference
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
          QuotationDetail: serie.DetailId,
          OrderDetail: _.findWhere(orderDetails, {QuotationDetail: serie.DetailId}),
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


