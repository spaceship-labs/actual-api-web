var Promise = require('bluebird');
var _ = require('underscore');
var moment = require('moment');
var EWALLET_TYPE = 'ewallet';
var CLIENT_BALANCE_TYPE = 'client-balance';
var EWALLET_NEGATIVE = 'negative';
var CANCELLED_STATUS = 'cancelled';
var PAYMENT_CANCEL_TYPE = 'cancellation';

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

    StockService.validateQuotationStockById(quotationId, req.user.id)
      .then(function(isValidStock){

        if(!isValidStock){
          return Promise.reject(new Error('Inventario no suficiente'));
        }

        var findQuotation = Quotation.findOne(form.Quotation).populate('Payments');

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

        return Payment.create(form);
      })
      .then(function(paymentCreated){
        quotationPayments = quotation.Payments.concat([paymentCreated]);

        var promises = [
          PaymentService.calculateQuotationAmountPaid(quotationPayments, exchangeRate)
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
      .spread(function(ammountPaid){
        quotationUpdateParams = {
          ammountPaid: ammountPaid,
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