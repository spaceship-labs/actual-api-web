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

  findAll: function(req, res){
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
      populateFields:['Client'],
      filters:{
      }
    };

    var clientSearch = form.clientSearch;
    var clientSearchFields = ['CardName', 'E_Mail', 'CardCode'];
    var preSearch = Promise.resolve();

    if(clientSearch && form.term){
      preSearch = ClientService.clientsIdSearch(form.term, clientSearchFields);
      delete form.term;
    }

    preSearch.then(function(preSearchResults){
        //Search by pre clients search
        if( preSearchResults && _.isArray(preSearchResults) ){
          extraParams.filters.Client = preSearchResults;
        }

        return Common.find(model, form, extraParams);
      })
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
    var clientId = UserService.getCurrentUserClientId(req);
    var currentUser = req.user;
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


        if(order.Client.id != clientId && currentUser.role !== 'admin'){
          return Promise.reject(new Error('No autorizado'));
        }

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
    var errLog;
    var quotationId = form.quotationId;
    var clientId = UserService.getCurrentUserClientId(req);

    sails.log.info('init order creation', new Date());
    sails.log.info('quotationId', form.quotationId);


    QuotationWeb.findOne({id: quotationId, select:['Client']})
      .then(function(quotation){

        if(quotation.Client != clientId){
          return Promise.reject(new Error('No autorizado'));
        }

        return OrderService.createFromQuotation(form, req);
      })
      .then(function(orderCreated){
        //RESPONSE
        sails.log.info('end ', new Date());
        sails.log.info('quotationId', form.quotationId);

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

        var promises = [
          Email.sendOrderConfirmation(order.id),
          Email.sendFreesale(order.id),
          InvoiceService.createOrderInvoice(order.id, req),
          OrderService.relateOrderToSap(order, orderDetails, req)
        ];

        return promises;
      })
      .spread(function(orderSent, freesaleSent, invoice, sapOrderRelated){
        console.log('Email de orden enviado: ' + order.folio);
        console.log('generated invoice', invoice);
        return Promise.resolve();
      })
      .catch(function(err){
        console.log('catch general createFromQuotation',err);
        errLog = err;
        
        if(!responseSent){
          res.negotiate(err);
        }

        sails.log.info('start finding quotationWithErr', quotationId);
        return QuotationWeb.findOne({id: quotationId, select:['folio']})
          .populate('Client');
      })
      .then(function(quotationWithErr){

        sails.log.info('quotationWithErr folio', (quotationWithErr || {}).folio);

        if(quotationWithErr){
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

          Email.sendQuotationLog(formArr, req.activeStore, function(){
            sails.log.info('Log de error enviado');
          });
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
    var resolved = false;
    ConektaService.processNotification(req, res)
      .then(function(result){
        console.log('Processed notification');
        res.ok();
        resolved = true;
      })
      .catch(function(err){
        console.log('err notification', err);
        if(!resolved){
          res.ok();
        }
        //res.negotiate(err);
      });
  }

};

