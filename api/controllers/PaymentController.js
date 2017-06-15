var Promise = require('bluebird');
var _ = require('underscore');
var moment = require('moment');
var EWALLET_TYPE = 'ewallet';
var CLIENT_BALANCE_TYPE = 'client-balance';
var EWALLET_NEGATIVE = 'negative';
var CANCELLED_STATUS = 'cancelled';
var PAYMENT_CANCEL_TYPE = 'cancellation';
module.exports = {

  test: function(req, res){
    ConektaService.test(req);
    res.ok();
  },

  add: function(req, res){
    var form        = req.params.all();
    var quotationId = form.quotationId;
    form.returnQuotation = true;
    PaymentService.addPayment(form,quotationId, req)
      .then(function(result){
        res.json(result);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      })
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