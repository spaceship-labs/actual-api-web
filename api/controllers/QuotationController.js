var Promise           = require('bluebird');
var _                 = require('underscore');
var assign            = require('object-assign');
var moment            = require('moment');
var EWALLET_TYPE      = 'ewallet';
var EWALLET_NEGATIVE  = 'negative';
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;


module.exports = {

  create: function(req, res){
    var form = req.params.all();
    var createdId;
    form.Details = formatProductsIds(form.Details);
    form.Store = req.activeStore.id;
    form.User = req.user.id;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStore: req.activeStore.id
    };

    Quotation.create(form)
      .then(function(created){
        createdId = created.id;
        var calculator = QuotationService.Calculator();
        if(!form.Details || form.Details.length === 0){
          opts.isEmptyQuotation = true;
        }

        return calculator.updateQuotationTotals(created.id, opts);
      })
      .then(function(updatedQuotation){
        return Common.nativeFindOne({_id: ObjectId(createdId)}, Quotation);
        //return Quotation.findOne({id:createdId});
      })
      .then(function(quotation){
        res.json(quotation);
      })
      .catch(function(err){
        console.log('err create quotation', err);
        res.negotiate(err);
      });
  },


  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    form.Store =  req.activeStore.id;

    Common.nativeFindOne({_id: ObjectId(createdId)}, Quotation)
      .then(function(quotation){
        if(quotation.User !== req.user.id){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }
        return Quotation.update({id:id}, form);
      })
      .then(function(updatedQuotation){
        if(updatedQuotation && updatedQuotation.length > 0){
          res.json(updatedQuotation[0]);
        }else{
          res.json(null);
        }
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  findByIdQuickRead: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var userId = req.user.id;
    var query = {
      id: id,
      User: userId
    };

    Quotation.findOne(query)
      .populate('Details')
      .then(function(quotation){
        if(!quotation){
          return Promise.reject(new Error('Cotización no encontrada'));
        }  
        if(quotation.User !== req.user.id){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }              
        res.json(quotation);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var userId = req.user.id;
    var getPayments = form.payments;
    var forceLatestData  = true;
    //var forceLatestData = !_.isUndefined(form.forceLatestData) ? form.forceLatestData : true;
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    var query = {
      id: id,
      User: req.user.id
    };

    var quotationQuery =  Quotation.findOne(query)
      .populate('Details')
      .populate('User')
      .populate('Client')
      .populate('Order');
      //.populate('Payments');
      //.populate('Records')
      //.populate('Manager');

    if(getPayments){
      quotationQuery.populate('Payments');
    }

    var updateToLatest = QuotationService.updateQuotationToLatestData(id, userId, {
      update:true,
      currentStore: req.activeStore.id
    });

    if(!forceLatestData){
      updateToLatest = new Promise(function(resolve, reject){
        resolve();
      });
    }

    updateToLatest.then(function(){
        return quotationQuery;
      })
      .then(function(quotation){
        if(!quotation){
          return Promise.reject(new Error('Cotización no encontrada'));
        }
        if(quotation.User.id !== req.user.id){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }        
        return res.json(quotation);
      })
      .catch(function(err){
        console.log('err findById quotation', err);
        return res.negotiate(err);
      });
  },



  addDetail: function(req, res){
    var form = req.params.all();
    var id = form.id;
    form.Quotation = id;
    form.Details = formatProductsIds(form.Details);
    form.shipDate = moment(form.shipDate).startOf('day').toDate();
    form.User = req.user.id;

    delete form.id;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStore: req.activeStore.id
    };
    
    Common.nativeFindOne({_id: ObjectId(id)}, Quotation)
      .then(function(quotation){
        if(quotation.User !== req.user.id){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }
        return QuotationDetail.create(form);
      })
      .then(function(created){
         var calculator = QuotationService.Calculator();
         return calculator.updateQuotationTotals(id, opts);
      })
      .then(function(updatedQuotation){
        return Quotation.findOne({id: id});
      })
      .then(function(quotation){
        res.json(quotation);
      })
      .catch(function(err){
        console.log('err addDetail quotation', err);
        res.negotiate(err);
      });

  },

  addMultipleDetails: function(req, res){
    var form = req.params.all();
    var id = form.id;
    form.Quotation = id;
    form.Details = formatProductsIds(form.Details);
    
    if(form.Details && form.Details.length > 0 && _.isArray(form.Details) ){
      form.Details = form.Details.map(function(d){
        d.shipDate = moment(d.shipDate).startOf('day').toDate();
        d.User = req.user.id;
        return d;
      });
    }

    delete form.id;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStore: req.activeStore.id
    };

    Common.nativeFindOne({_id: ObjectId(id)}, Quotation)
      .then(function(quotation){
        if(quotation.User !== req.user.id){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }
        return QuotationDetail.create(form.Details);
      })
      .then(function(created){
         var calculator = QuotationService.Calculator();
         return calculator.updateQuotationTotals(id, opts);
      })
      .then(function(updatedQuotation){
        return Quotation.findOne({id: id});
      })
      .then(function(quotation){
        res.json(quotation);
      })
      .catch(function(err){
        console.log('err addDetail quotation', err);
        res.negotiate(err);
      });

  },  

  removeDetailsGroup: function(req, res){
    var form = req.params.all();
    var detailsIds = form.detailsIds;
    var quotationId = form.quotation;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStore: req.user.activeStore.id
    };


    Common.nativeFindOne({_id: ObjectId(id)}, QuotationDetail)
      .then(function(quotationDetail){
        if(quotationDetail.User !== req.user.id){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }

        return QuotationDetail.destroy({id:detailsIds});
      })
      .then(function(){
        var calculator = QuotationService.Calculator();
        return calculator.updateQuotationTotals(quotationId, opts);
      })
      .then(function(updatedQuotationResult){
        return Quotation.findOne({id: quotationId}).populate('Details');
      })
      .then(function(quotation){
        res.json(quotation);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  find: function(req, res){
    var form = req.params.all();
    form.filters = form.filters || {};
    form.filters.User = req.user.id;

    var client = form.client;
    var model = 'quotation';
    var clientSearch = form.clientSearch;
    var clientSearchFields = ['CardName', 'E_Mail'];
    var preSearch = new Promise(function(resolve, reject){
      resolve();
    });

    if(clientSearch && form.term){
      preSearch = clientsIdSearch(form.term, clientSearchFields);
      delete form.term;
    }

    var extraParams = {
      searchFields: ['folio','id'],
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

  getQuotationTotals: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var paymentGroup = form.paymentGroup || 1;
    var params = {
      update: false,
      paymentGroup: paymentGroup,
      currentStore: req.activeStore.id
    };
    var calculator = QuotationService.Calculator();
    console.log('params', params);

    Common.nativeFindOne({_id: ObjectId(id)}, Quotation)
      .then(function(quotation){
        if(quotation.User !== req.user.id){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }        
        return calculator.getQuotationTotals(id, params);
      })
      .then(function(totals){
        res.json(totals);
      })
      .catch(function(err){
        console.log('err getQuotationTotals', err);
        res.negotiate(err);
      });
  },


  sendEmail: function(req, res){
    var form = req.params.all();
    var id = form.id;

    Common.nativeFindOne({_id: ObjectId(id)}, Quotation)
      .then(function(quotation){
        if(quotation.User !== req.user.id){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }      
        return Email.sendQuotation(id);
      })
      .then(function(quotation) {
        return res.json(quotation);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  getCurrentStock: function(req, res){
    var form = req.allParams();
    var quotationId = form.quotationId;
    var warehouse;
    var details;
    var query = {
      Quotation: quotationId,
      User: req.user.id
    };

    QuotationDetail.find(query).populate('Product')
      .then(function(detailsFound){
        details = detailsFound;
        var whsId = req.activeStore.Warehouse;
        return Company.findOne({id: whsId});
      })
      .then(function(warehouse){
        return StockService.getDetailsStock(details, warehouse);    
      })
      .then(function(results){
        res.json(results);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });

  },

  validateStock: function(req, res){
    var form = req.allParams();
    var quotationId = form.id;
    StockService.validateQuotationStockById(quotationId, req.user.id)
      .then(function(isValid){
        return res.json({isValid: isValid});
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });
  },

  getQuotationPaymentOptions: function(req, res){
    var form = req.allParams();
    var quotationId = form.id;

    Common.nativeFindOne({_id: ObjectId(quotationId)}, Quotation)
      .then(function(quotation){
        if(quotation.User !== req.user.id){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }   

        return PaymentService.getMethodGroupsWithTotals(quotationId, quotation.User);
      })
      .then(function(paymentOptions){
        res.json(paymentOptions);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getQuotationPayments: function(req, res){
    var form = req.allParams();
    var quotationId = form.id;
    var query = {
      Quotation: quotationId,
      User: req.user.id
    };
    Payment.find(query)
      .then(function(payments){
        res.json(payments);
      })
      .catch(function(err){
        console.log('err',err)
        res.negotiate(err);
      });
  },

  getQuotationSapLogs: function(req, res){
    var form = req.allParams();
    var quotationId = form.id;
    var query = {
      Quotation:quotationId,
      User: req.user.id
    };

    SapOrderConnectionLog.find(query)
      .then(function(logs){
        res.json(logs);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }

};

function clientsIdSearch(term, searchFields){
  var query = {};
  if(searchFields.length > 0){
    query.or = [];
    for(var i=0;i<searchFields.length;i++){
      var field = searchFields[i];
      var obj = {};
      obj[field] = {contains:term};
      query.or.push(obj);
    }
  }
  return Client.find(query)
    .then(function(clients){
      if(!clients){
        return [];
      }
      return clients.map(function(c){return c.id;});
    });
}

function tagImmediateDeliveriesDetails(details){
  if(details && details.length > 0){
    for(var i=0;i<details.length;i++){
      if(isImmediateDelivery(details[i].shipDate)){
        details[i].immediateDelivery = true;
      }
    }
    return details;
  }
  return [];
}


function isImmediateDelivery(shipDate){
  var currentDate = moment().format();
  shipDate = moment(shipDate).format();
  return currentDate === shipDate;
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
