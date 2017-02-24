var Promise = require('bluebird');
var _ = require('underscore');
var moment = require('moment');
var EWALLET_TYPE = 'ewallet';
var CLIENT_BALANCE_TYPE = 'client-balance';
var EWALLET_NEGATIVE = 'negative';
var CANCELLED_STATUS = 'cancelled';
var PAYMENT_CANCEL_TYPE = 'cancellation';
var conekta = require('conekta');

conekta.api_key = '9YxqfRnx4sMQDnRsqdYn';
conekta.locale = 'es';

conekta.Order.create({
    "currency": "MXN",
    "customer_info": {
        "name": "Jul Ceballos",
        "phone": "+5215555555555",
        "email": "jul@conekta.io"
    },
    "line_items": [{
        "name": "Box of Cohiba S1s",
        "description": "Imported From Mex.",
        "unit_price": 35000,
        "quantity": 1,
        "tags": ["food", "mexican food"],
        "type": "physical"
    }]
  }, function(err, res) {
    if (err) {
        console.log(err.type);
        return;
    }
    console.log(res.toObject());
});

module.exports = {

  add: function(req, res){
    var form          = req.params.all();
    var quotationId   = form.quotationid;
    var totalDiscount = form.totalDiscount || 0;
    var paymentGroup  = form.group || 1;
    var client        = false;
    var quotationPayments = [];
    var exchangeRate;
    var quotation;
    var quotationUpdateParams;
    form.Quotation    = quotationId;
    form.Store = req.activeStore.id;
    form.User = req.user.id;    

    if (form.Details) {
      form.Details = formatProductsIds(form.Details);
    }

    StockService.validateQuotationStockById(quotationId, req)
      .then(function(isValidStock){

        if(!isValidStock){
          return Promise.reject(new Error('Inventario no suficiente'));
        }

        var findQuotation = QuotationWeb.findOne(form.Quotation).populate('Payments');

        if(form.type === EWALLET_TYPE || form.type === CLIENT_BALANCE_TYPE){
          findQuotation.populate('Client');
        }

        return findQuotation;
      })
      .then(function(quotationFound){
        quotation = quotationFound;
        client = quotation.Client;
        form.Client = client.id || client;

        if(form.type === EWALLET_TYPE){
          if( !EwalletService.isValidEwalletPayment(form, client) ){
            return Promise.reject(new Error('Fondos insuficientes en monedero electronico'));
          }
        }

        if(form.type === CLIENT_BALANCE_TYPE){
          if(!ClientBalanceService.isValidClientBalancePayment(form, client)){
            return Promise.reject(new Error('Fondos insuficientes en balance de cliente'));
          }
        }

        return PaymentService.getExchangeRate();
      })
      .then(function(exchangeRateFound){
        exchangeRate = exchangeRateFound;

        return PaymentWeb.create(form);
      })
      .then(function(paymentCreated){
        quotationPayments = quotation.Payments.concat([paymentCreated]);

        var promises = [
          PaymentService.calculateQuotationAmountPaid(quotationPayments, exchangeRate),
          PaymentService.calculateQuotationAmountPaidGroup1(quotationPayments, exchangeRate)
        ];

        if(form.type === EWALLET_TYPE){
          promises.push(
            EwalletService.applyEwalletRecord(form,{
              quotationId: quotationId,
              userId: req.user.id,
              client: client,
              paymentId: paymentCreated.id
            })
          );
        }

        if(form.type === CLIENT_BALANCE_TYPE){
          promises.push(
            ClientBalanceService.applyClientBalanceRecord(form,{
              quotationId: quotationId,
              userId: req.user.id,
              client: client,
              paymentId: paymentCreated.id              
            })
          );
        }        

        return promises;
      })
      .spread(function(ammountPaid, ammountPaidPg1){
        quotationUpdateParams = {
          ammountPaid: ammountPaid,
          ammountPaidPg1: ammountPaidPg1,
          paymentGroup: paymentGroup
        };
        return QuotationService.nativeQuotationUpdate(quotationId, quotationUpdateParams);
        //return Quotation.update({id:quotationId}, params);
      })
      .then(function(resultUpdate){
        delete quotation.Payments;
        quotation.ammountPaid = quotationUpdateParams.ammountPaid;
        quotation.paymentGroup = quotationUpdateParams.paymentGroup;

        res.json(quotation);

        //var updatedQuotation = resultUpdate[0];
        //res.json(updatedQuotation);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },



  getPaymentGroups: function(req, res){
    var paymentGroups = PaymentService.getPaymentGroups();
    res.json(paymentGroups);
  }	
};

function formatProductsIds(details){
  var result = [];
  if(details && details.length > 0){
    result = details.map(function(d){
      if(d.Product){
        d.Product = (typeof d.Product == 'string') ? d.Product :  d.Product.id;
      }
      return d;
    });
  }
  return result;
}