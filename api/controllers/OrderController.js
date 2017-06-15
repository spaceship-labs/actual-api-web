var _ = require('underscore');
var Promise = require('bluebird');
var INVOICE_SAP_TYPE = 'Invoice';
var ORDER_SAP_TYPE = 'Order';
var ERROR_SAP_TYPE = 'Error';
var CLIENT_BALANCE_TYPE = 'client-balance';
var BALANCE_SAP_TYPE = 'Balance';


module.exports = {
  find: function(req, res){
    var form = req.params.all();
    var model = 'orderweb';
    var extraParams = {
      searchFields: [
        'folio',
        'CardName',
        'CardCode'
      ],
      selectFields: form.fields,
      populateFields:['invoice'],
      filters:{
        Client: req.user.id
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
      .populate('User')
      .populate('Client')
      .populate('Address')
      .populate('Payments')
      .populate('Store')
      .populate('OrdersSap')
      .populate('SapOrderConnectionLog')
      .then(function(foundOrder){
        order = foundOrder.toObject();
        var sapReferencesIds = order.OrdersSap.map(function(ref){
          return ref.id;
        });
        return OrderSapWeb.find(sapReferencesIds)
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
    var form = req.params.all();
    var order;
    var responseSent = false;
    var orderDetails;

    OrderService.createFromQuotation2(form, req)
      /*
      .then(function(conektaOrder){
        res.json(conektaOrder);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });
      */
    /*
    OrderService.createFromQuotation(form, req)
    */
      .then(function(orderCreated){
        //RESPONSE
        res.json(orderCreated);
        responseSent = true;
        order = orderCreated;
        orderDetails = orderCreated.Details;

        //STARTS EMAIL SENDING PROCESS
        return OrderWeb.findOne({id:orderCreated.id})
          .populate('Client')
          .populate('Payments')
          .populate('Address');
      })
      .then(function(order){
        return [
          Email.sendOrderConfirmation(order.id),
          Email.sendFreesale(order.id),
          InvoiceService.createOrderInvoice(order.id),
          StockService.syncOrderDetailsProducts(orderDetails)
        ];
      })
      .spread(function(orderSent, freesaleSent, invoice, productsSynced){
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

