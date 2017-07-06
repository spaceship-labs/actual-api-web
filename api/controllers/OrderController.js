var _ = require('underscore');
var Promise = require('bluebird');
var INVOICE_SAP_TYPE = 'Invoice';
var ORDER_SAP_TYPE = 'Order';
var ERROR_SAP_TYPE = 'Error';
var CLIENT_BALANCE_TYPE = 'client-balance';
var BALANCE_SAP_TYPE = 'Balance';


module.exports = {
  sendOrderEmail: function(req, res){
    var form = req.params.all();
    var orderId = form.id;
    Email.sendOrderConfirmation(orderId)
      .then(function(){
        res.ok();
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },
  
  find: function(req, res){
    var form = req.params.all();
    var model = 'orderweb';
    var clientId = UserService.getCurrentUserClientId(req);

    var extraParams = {
      searchFields: [
        'folio',
        'CardName',
        'CardCode'
      ],
      selectFields: form.fields,
      populateFields:['invoice'],
      filters:{
        Client: clientId
      }
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

    OrderWeb.findOne({id: id})
      .populate('Details')
      .populate('UserWeb')
      .populate('Client')
      .populate('Address')
      .populate('Payments')
      .populate('Store')
      .populate('OrdersSapWeb')
      .populate('SapOrderConnectionLogWeb')
      .then(function(foundOrder){
        order = foundOrder.toObject();
        var sapReferencesIds = order.OrdersSapWeb.map(function(ref){
          return ref.id;
        });
        return OrderSapWeb.find(sapReferencesIds)
          .populate('PaymentsSapWeb')
          .populate('ProductSeriesWeb');
      })
      .then(function(ordersSapWeb){
        order.OrdersSapWeb = ordersSapWeb;
        res.json(order);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  createFromQuotation: function(req, res){
    var form = req.params.all();
    var order;
    var responseSent = false;
    var orderDetails;

    sails.log.info('init order creation', new Date());
    sails.log.info('quoationId', form.quotationId);
    OrderService.createFromQuotation(form, req)
      .then(function(orderCreated){
        //RESPONSE
        sails.log.info('end ', new Date());
        sails.log.info('quoationId', form.quotationId);

        res.json(orderCreated);
        responseSent = true;

        //STARTS EMAIL SENDING PROCESS
        return OrderWeb.findOne({id:orderCreated.id})
          .populate('UserWeb')
          .populate('Client')
          .populate('Payments')
          .populate('Address');
      })
      .then(function(_order){
        order = _order;
        return OrderDetailWeb.find({OrderWeb: order.id}).populate('Product');
      })
      .then(function(_orderDetails){
        orderDetails = _orderDetails;

        return [
          Email.sendOrderConfirmation(order.id),
          Email.sendFreesale(order.id),
          InvoiceService.createOrderInvoice(order.id, req),
          OrderService.relateOrderToSap(order, orderDetails, req),
          StockService.syncOrderDetailsProducts(orderDetails)
        ];
      })
      .spread(function(orderSent, freesaleSent, invoice, sapOrderRelated,productsSynced){
        console.log('Email de orden enviado: ' + order.folio);
        console.log('productsSynced', productsSynced);
        console.log('generated invoice', invoice);
      })
      .catch(function(err){
        console.log(err);
        if(!responseSent){
          res.negotiate(err);
        }
      });
    
  },

  generateSapOrder: function(req, res){
    var form = req.allParams();
    var id = form.id;
    var promises = [
      OrderWeb.findOne({id: id})
        .populate('UserWeb')
        .populate('Client')
        .populate('Address')
        .populate('Payments'),
      OrderDetailWeb.find({OrderWeb: id}).populate('Product')
    ];

    Promise.all(promises)
      .then(function(results){
        var order = results[0];
        var orderDetails = results[1];

        if(!order){
          return Promise.reject(new Error('No se encontro el pedido'));
        }

        return OrderService.relateOrderToSap(order, orderDetails, req);
      })
      .then(function(){
        res.ok();
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });
  },

  getInvoicesLogs: function(req, res){
    var form = req.params.all();
    var orderId = form.orderId;

    AlegraLogWeb.find({OrderWeb: orderId})
      .then(function(logs){
        res.json(logs);
      })
      .catch(function(err){
        console.log('err' , err);
        res.negotiate(err);
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
  },

  receiveSpeiNotification: function(req, res){
    ConektaService.processNotification(req, res)
      .then(function(res){
        console.log('Prcoessed notification');
        //res.ok();
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });
  }

};

