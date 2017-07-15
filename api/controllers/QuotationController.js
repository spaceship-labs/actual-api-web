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
    form.Details = form.Details.map(function(d){
      if(req.user){
        d.UserWeb = req.user.id;
      }
      return d;
    });
    form.Store = req.activeStore.id;
    if(req.user){
      form.UserWeb = req.user.id;
      form.Client = req.user.Client;
    }

    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStore: req.activeStore.id
    };

    QuotationWeb.create(form)
      .then(function(created){
        createdId = created.id;
        var calculator = QuotationService.Calculator();
        if(!form.Details || form.Details.length === 0){
          opts.isEmptyQuotation = true;
        }

        return calculator.updateQuotationTotals(created.id, opts);
      })
      .then(function(updatedQuotation){
        return Common.nativeFindOne({_id: ObjectId(createdId)}, QuotationWeb);
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
    var userId = UserService.getCurrentUserId(req);
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    form.Store =  req.activeStore.id;

    Common.nativeFindOne({_id: ObjectId(id)}, QuotationWeb)
      .then(function(quotation){
        if(req.user){
          if(quotation.Client !== currentUserClientId && quotation.Client){
            return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
          }
        }
        return QuotationWeb.update({id:id}, form);
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

  updateQuotationAddress: function(req, res){
    var form = req.params.all();
    var quotationId = form.id;
    var params = {
      Address: form.addressId
    };
    var contactId;
    var updatedQuotation;
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    form.Store =  req.activeStore.id;


    Common.nativeFindOne({_id: ObjectId(quotationId)}, QuotationWeb)
      .then(function(quotation){
        if(req.user){
          if(quotation.Client !== currentUserClientId && quotation.Client){
            return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
          }
        }
        return QuotationWeb.update({id:quotationId}, params);
      })
      .then(function(resultUpdate){
        updatedQuotation = resultUpdate[0];
        contactId = updatedQuotation.Address;
        return QuotationService.setQuotationZipcodeDeliveryByContactId(quotationId, contactId);
      })
      .then(function(){
        res.json(updatedQuotation);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },  

  findByIdQuickRead: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var query = {
      id: id,
    };
    var userId = UserService.getCurrentUserId(req);
    var currentUserClientId = UserService.getCurrentUserClientId(req);

    if(req.user){
      query.Client = currentUserClientId;
    }

    QuotationWeb.findOne(query)
      .populate('Details')
      .then(function(quotation){
        if(!quotation){
          return Promise.reject(new Error('Cotización no encontrada'));
        } 
        if(quotation.Client){
          if(quotation.Client !== currentUserClientId){
            return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
          }              
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
    var getPayments = form.payments;
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    var query = {
      id: id
    };
    var userId = UserService.getCurrentUserId(req);
    var currentUserClientId = UserService.getCurrentUserClientId(req);

    if(req.user){
      query.Client = currentUserClientId;
    }

    var quotationQuery =  QuotationWeb.findOne(query)
      .populate('Details')
      .populate('Client')
      .populate('ZipcodeDelivery')
      .populate('OrderWeb');
      //.populate('Payments');

    if(getPayments){
      quotationQuery.populate('Payments');
    }

    var updateToLatest = QuotationService.updateQuotationToLatestData(id, {
      update:true,
      currentStore: req.activeStore.id
    });

    updateToLatest.then(function(){
        return quotationQuery;
      })
      .then(function(quotation){

        if(!quotation){
          return Promise.reject(new Error('Cotización no encontrada'));
        }
  
        if(quotation.Client){
          if(quotation.Client.id !== currentUserClientId){
            return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
          }        
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
    var currentUserClientId = UserService.getCurrentUserClientId(req);

    form.QuotationWeb = id;
    form.Details = formatProductsIds(form.Details);
    form.shipDate = moment(form.shipDate).startOf('day').toDate();
    
    if(req.user){
      form.Client = currentUserClientId;
    }

    delete form.id;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStore: req.activeStore.id
    };
    
    Common.nativeFindOne({_id: ObjectId(id)}, QuotationWeb)
      .then(function(quotation){
        if(req.user){
          if(quotation.Client !== currentUserClientId){
            return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
          }
        }
        return QuotationDetailWeb.create(form);
      })
      .then(function(created){
         var calculator = QuotationService.Calculator();
         return calculator.updateQuotationTotals(id, opts);
      })
      .then(function(updatedQuotation){
        return QuotationWeb.findOne({id: id});
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
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    form.QuotationWeb = id;
    form.Details = formatProductsIds(form.Details);
    
    if(form.Details && form.Details.length > 0 && _.isArray(form.Details) ){
      form.Details = form.Details.map(function(d){
        d.shipDate = moment(d.shipDate).startOf('day').toDate();
        if(req.user){
          d.Client = req.user.id;
        }
        return d;
      });
    }

    delete form.id;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStore: req.activeStore.id
    };

    Common.nativeFindOne({_id: ObjectId(id)}, QuotationWeb)
      .then(function(quotation){
        if(quotation.Client !== currentUserClientId){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }
        return QuotationDetailWeb.create(form.Details);
      })
      .then(function(created){
         var calculator = QuotationService.Calculator();
         return calculator.updateQuotationTotals(id, opts);
      })
      .then(function(updatedQuotation){
        return QuotationWeb.findOne({id: id});
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
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStore: req.activeStore.id
    };


    Common.nativeFindOne({_id: ObjectId(quotationId)}, QuotationWeb)
      .then(function(quotation){
        if(quotation.Client !== currentUserClientId){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }

        return QuotationDetailWeb.destroy({id:detailsIds});
      })
      .then(function(){
        var calculator = QuotationService.Calculator();
        return calculator.updateQuotationTotals(quotationId, opts);
      })
      .then(function(updatedQuotationResult){
        return QuotationWeb.findOne({id: quotationId}).populate('Details');
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
    var clientId = UserService.getCurrentUserClientId(req);
    form.filters = form.filters || {};
    form.filters.Client = clientId;

    var model = 'quotationweb';
    var extraParams = {
      searchFields: ['folio','id'],
      selectFields: form.fields,
      filters: form.filters
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

    Common.nativeFindOne({_id: ObjectId(id)}, QuotationWeb)
      .then(function(quotation){
        /*
        if(quotation.User !== req.user.id){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }   
        */     
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
    var currentUserClientId = UserService.getCurrentUserClientId(req);

    Common.nativeFindOne({_id: ObjectId(id)}, QuotationWeb)
      .then(function(quotation){
        if(quotation.Client !== currentUserClientId){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }      
        return Email.sendQuotation(id, req.activeStore);
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
    var details;
    var quotation;
    var query = {
      QuotationWeb: quotationId,
    };

    /*
    if(req.user){
      query.Client = req.user.id;      
    }else{
      query.Client = null;
    }
    */

    var promises = [
      QuotationWeb.findOne({id:quotationId, select:['ZipcodeDelivery']}),
      QuotationDetailWeb.find(query).populate('Product')
    ];
      
      Promise.all(promises)
      .then(function(results){
        quotation = results[0];
        details = results[1];
        var whsId = req.activeStore.Warehouse;
        return Company.findOne({id: whsId});
      })
      .then(function(warehouse){
        var zipcodeDeliveryId = quotation.ZipcodeDelivery;
        var activeStore = req.activeStore;
        return StockService.getDetailsStock(details, warehouse, zipcodeDeliveryId, activeStore);    
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
    StockService.validateQuotationStockById(quotationId, req)
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
    var currentUserClientId = UserService.getCurrentUserClientId(req);

    Common.nativeFindOne({_id: ObjectId(quotationId)}, QuotationWeb)
      .then(function(quotation){
        
        if(quotation.Client){
          if(quotation.Client !== currentUserClientId){
            return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
          }   
        }

        var options = {
          financingTotals: form.financingTotals || false
        };
        
        return PaymentService.getMethodGroupsWithTotals(quotationId, req.activeStore, options);
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
      QuotationWeb: quotationId
    };
    PaymentWeb.find(query)
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
      QuotationWeb:quotationId
    };

    SapOrderConnectionLogWeb.find(query)
      .then(function(logs){
        res.json(logs);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getQuotationZipcodeDelivery: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var query = {
      id: id,
    };
    var currentUserClientId = UserService.getCurrentUserClientId(req);


    if(req.user){
      query.Client = req.user.id;
    }

    QuotationWeb.findOne(query)
      .populate('ZipcodeDelivery')
      .then(function(quotation){
        if(!quotation){
          return Promise.reject(new Error('Cotización no encontrada'));
        } 
        if(quotation.Client){
          if(quotation.Client !== currentUserClientId){
            return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
          }              
        }
        res.json(quotation.ZipcodeDelivery);
      })
      .catch(function(err){
        console.log('err', err);
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
