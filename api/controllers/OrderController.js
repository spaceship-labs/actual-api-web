var _ = require('underscore');
var Promise = require('bluebird');
var EWALLET_POSITIVE = 'positive';
var INVOICE_SAP_TYPE = 'Invoice';
var ORDER_SAP_TYPE = 'Order';
var ERROR_SAP_TYPE = 'Error';
var CLIENT_BALANCE_TYPE = 'client-balance';
var BALANCE_SAP_TYPE = 'Balance';


module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'order';
    var extraParams = {
      searchFields: [
        'folio',
        'CardName',
        'CardCode'
      ],
      selectFields: form.fields,
      populateFields: ['Client']
    };
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var order;
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    Order.findOne({id: id})
      .populate('Details')
      .populate('User')
      .populate('Client')
      .populate('Address')
      .populate('Payments')
      .populate('Store')
      .populate('EwalletRecords')
      .populate('Broker')
      .populate('OrdersSap')
      .populate('SapOrderConnectionLog')
      .then(function(foundOrder){
        order = foundOrder.toObject();
        var sapReferencesIds = order.OrdersSap.map(function(ref){
          return ref.id;
        });
        return OrderSap.find(sapReferencesIds)
          .populate('PaymentsSap')
          .populate('ProductSeries');
      })
      .then(function(ordersSap){
        order.OrdersSap = ordersSap;
        res.json(order);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  createFromQuotation: function(req, res){
    sails.log.warn('LLEGO A accion createFromQuotation');
    var form = req.params.all();
    var order;
    var responseSent = false;

    OrderService.createFromQuotation(form, req.user)
      .then(function(orderCreated){
        //RESPONSE
        res.json(orderCreated);
        responseSent = true;
        order = orderCreated;

        //STARTS EMAIL SENDING PROCESS
        return Order.findOne({id:orderCreated.id})
          .populate('User')
          .populate('Client')
          .populate('Payments')
          .populate('EwalletRecords')
          .populate('Address');
      })
      .then(function(order){
        return [
          Email.sendOrderConfirmation(order.id),
          Email.sendFreesale(order.id),
          //InvoiceService.create(order.id)
        ];
      })
      //.spread(function(orderSent, freesaleSent, alegraInvoice){
      .spread(function(orderSent, freesaleSent){
        console.log('Email de orden enviado: ' + order.folio);
      })
      /*
        sails.log.info('Email de orden enviado');
        return Invoice.create({ id: alegraInvoice.id, order: order });
      })
      .then(function(invoice){
        console.log('generated invoice', invoice);
      })
      */
      .catch(function(err){
        console.log(err);
        if(!responseSent){
          res.negotiate(err);
        }
      });
  },

  getCountByUser: function(req, res){
    var form = req.params.all();
    OrderService.getCountByUser(form)
      .then(function(result){
        res.json(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  getTotalsByUser: function(req, res){
    var form = req.params.all();
    OrderService.getTotalsByUser(form)
      .then(function(result){
        res.json(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }

};

