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
    var exchangeRate;
    var quotation;
    form.Quotation    = quotationId;
    form.Store = req.user.activeStore.id;
    form.User = req.user.id;    

    if (form.Details) {
      form.Details = formatProductsIds(form.Details);
    }

    StockService.validateQuotationStockById(quotationId, req.user.id)
      .then(function(isValidStock){
        if(!isValidStock){
          return Promise.reject(new Error('Inventario no suficiente'));
        }else{
        	sails.log.info('Inventario valido');
        }
        return Quotation.findOne(form.Quotation).populate('Client');
      })
      .then(function(quotationFound){
        quotation = quotationFound;
        client = quotation.Client;
        form.Client = client.id;

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
        //return calculateQuotationAmountPaid(quotationId, exchangeRate);
        return Payment.create(form);
      })
      .then(function(paymentCreated){
        var promises = [
          calculateQuotationAmountPaid(quotationId, exchangeRate)
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
        var params = {
          ammountPaid: ammountPaid,
          paymentGroup: paymentGroup
        };
        return Quotation.update({id:quotationId}, params);
      })
      .then(function(updatedQuotation){
        return Quotation.findOne({id:quotationId}).populate('Client');
      })
      .then(function(populatedQuotation){
        res.json(populatedQuotation);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  cancel: function(req, res){
    var form = req.allParams();
    var paymentId = form.paymentId;
    var quotationId = form.quotationId;
    var negativePayment; 
    res.negotiate(new Error('Cancelaciones no disponibles'));
    /* 
      Payment.findOne({id:paymentId})
      .then(function(payment){
        if(payment.isCancellation){
          return Promise.reject(new Error('No es posible cancelar un pago negativo'));
        }

        negativePayment = _.omit(payment,[
          'id',
          'folio',
          'createdAt',
          'updatedAt'
        ]);
        negativePayment.ammount = negativePayment.ammount * -1;
        negativePayment.isCancellation = true;

        return Payment.update({id:paymentId}, {isCancelled: true});
      })
      .then(function(paymentUpdated){
        sails.log.info('payment updated', paymentUpdated);
        return Payment.create(negativePayment);
      })
      .then(function(negativePaymentCreated){
        return calculateQuotationAmountPaid(quotationId);
      })
      .then(function(ammountPaid){
        var params = {
          ammountPaid: ammountPaid,
          paymentGroup: paymentGroup
        };
        return Quotation.update({id:quotationId}, params);
      })
      .then(function(){
        return Quotation.findOne({id: quotationId}).populate('Payments');
      })
      .then(function(updatedQuotation){
        res.json(updatedQuotation);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
    */    
  },

  getPaymentGroups: function(req, res){
    var paymentGroups = PaymentService.getPaymentGroups();
    res.json(paymentGroups);
  }	
};

function calculateQuotationAmountPaid(quotationId, exchangeRate){
  return Quotation.findOne({id: quotationId}).populate('Payments')
    .then(function(quotation){
      var payments  = quotation.Payments || [];

      var ammounts = payments.map(function(payment){
        if(payment.type === 'cash-usd'){
         return calculateUSDPayment(payment, exchangeRate);
        }
        return payment.ammount;
      });

      var ammountPaid = ammounts.reduce(function(paymentA, paymentB){
        return paymentA + paymentB;
      });

      return ammountPaid;
    });  
}

function calculateUSDPayment(payment, exchangeRate){
  return payment.ammount * exchangeRate;
}

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