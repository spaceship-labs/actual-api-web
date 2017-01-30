var Promise           = require('bluebird');
var _                 = require('underscore');
var assign            = require('object-assign');
var moment            = require('moment');
var EWALLET_TYPE      = 'ewallet';
var EWALLET_NEGATIVE  = 'negative';

module.exports = {

  create: function(req, res){
    var form = req.params.all();
    var createdId;
    form.Details = formatProductsIds(form.Details);
    form.Details = tagImmediateDeliveriesDetails(form.Details);    
    form.Store = req.user.activeStore.id;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStore: req.user.activeStore.id
    };

    Quotation.create(form)
      .then(function(created){
        createdId = created.id;
        var calculator = QuotationService.Calculator();
        return calculator.updateQuotationTotals(created.id, opts);
      })
      .then(function(updatedQuotation){
        return Quotation.findOne({id:createdId});
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
    form.Store =  req.user.activeStore.id;

    Quotation.update({id:id}, form)
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

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var baseQuotation = false;
    var userId = req.user.id;
    var getPayments = form.payments;
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    
    var quotationQuery =  Quotation.findOne({id: id})
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

    QuotationService.updateQuotationToLatestData(id, userId, {
      update:true,
      currentStore: req.user.activeStore.id
    })
      .then(function(){
        return quotationQuery;
      })
      .then(function(quotation){
        if(!quotation){
          return Promise.reject(new Error('Cotización no encontrada'));
        }
        return res.json(quotation);
      })
      .catch(function(err){
        console.log('err findById quotation', err);
        return res.negotiate(err);
      });
  },

  closeQuotation: function(req, res){
    var form = req.params.all();
    var id = _.clone(form.id);
    var createdRecord = false;
    form.dateTime = new Date();
    form.eventType = 'Cierre';
    form.Quotation = id;
    delete form.id;
    QuotationRecord.create(form)
      .then(function(createdRecordResult){
        createdRecord = createdRecordResult;
        var updateParams = {
          isClosed: true,
          isClosedReason: form.closeReason,
          isClosedNotes: form.extraNotes,
          status: 'closed',
        };   
        //sails.log.info('createdRecord', createdRecord);
        return [
          Quotation.update({id:id},updateParams),
          QuotationRecord.findOne({id: createdRecord.id}).populate('User')
        ];
      })
      .spread(function(updateResults, record){
        var updatedQuotation = updateResults[0];
        res.json({
          quotation: updatedQuotation || false,
          record: record
        });
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },

  addRecord: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var createdRecord = false;
    var addedFile = false;
    if( !isNaN(id) ){
      id = parseInt(id);
    }
    delete form.id;
    form.Quotation = id;

    QuotationRecord.create(form)
      .then(function(createdRecordResult){
        createdRecord = createdRecordResult;
        return QuotationRecord.findOne({id:createdRecord.id}).populate('User');
      })
      .then(function(foundRecord){
        createdRecord = foundRecord;
        //if(req.file('file')._files[0]){
        if(req._fileparser.upstreams.length){

          var options = {
            dir : 'records/gallery',
            profile: 'gallery'            
          };

          return createdRecord.addFiles(req, options)
            .then(function(recordWithFiles){
              return QuotationRecord.findOne({id:createdRecord.id})
                .populate('User')
                .populate('files');
            });

        }else{
          sails.log.info('not adding file');
        }
        return createdRecord;
      })
      .then(function(record){
        res.json(record);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });

  },


  addDetail: function(req, res){
    sails.log.info('adding quotation detail');
    var form = req.params.all();
    var id = form.id;
    form.Quotation = id;
    form.Details = formatProductsIds(form.Details);
    form.Details = tagImmediateDeliveriesDetails(form.Details);
    form.shipDate = moment(form.shipDate).startOf('day').toDate();

    delete form.id;
    var opts = {
      paymentGroup:1,
      updateDetails: true,
      currentStore: req.user.activeStore.id
    };
    
    QuotationDetail.create(form)
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

    QuotationDetail.destroy({id:detailsIds})
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

  findByClient: function(req, res){
    var form = req.params.all();
    var client = form.client;
    var model = 'quotation';
    var extraParams = {
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

  find: function(req, res){
    var form = req.params.all();
    form.filters = form.filters || {};

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

      preSearch.then(function(preSearchResults){
        //Search by pre clients search
        if( preSearchResults && _.isArray(preSearchResults) ){
          form.filters.Client = preSearchResults;
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

  getQuotationTotals: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var paymentGroup = form.paymentGroup || 1;
    var params = {
      update: false,
      paymentGroup: paymentGroup,
      currentStore: req.user.activeStore.id
    };
    var calculator = QuotationService.Calculator();
    console.log('params', params);

    calculator.getQuotationTotals(id, params)
      .then(function(totals){
        res.json(totals);
      })
      .catch(function(err){
        console.log('err getQuotationTotals', err);
        res.negotiate(err);
      });
  },

  getRecords: function(req, res){
    var form = req.params.all();
    var id = form.id;
    QuotationRecord.find({Quotation:id})
      .populate('User')
      .populate('files')
      .then(function(records){
        res.json(records);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  getCountByUser: function(req, res){
    var form    = req.params.all();
    var options = form;
    QuotationService.getCountByUser(options)
      .then(function(count){
        res.json(count);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  getTotalsByUser: function(req, res){
    var form = req.params.all();
    var options = form;
    QuotationService.getTotalsByUser(options)
      .then(function(totals){
        res.json(totals);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  sendEmail: function(req, res){
    var form = req.params.all();
    var id = form.id;
    Email
      .sendQuotation(id)
      .then(function(quotation) {
        return res.json(quotation);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  updateSource: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var source = form.source;
    var params = {
      Broker: null,
      source: source
    };    
    Quotation.update({id:id}, params)
      .then(function(updated){
        res.json(updated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  updateBroker: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var brokerId = form.brokerId;
    var params = {
      Broker: brokerId,
      source: null
    };
    Quotation.update({id:id}, params)
      .then(function(updated){
        res.json(updated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getCurrentStock: function(req, res){
    var form = req.allParams();
    var quotationId = form.quotationId;
    var warehouse;
    Quotation.findOne({id: quotationId}).populate('Details')
      .then(function(quotation){
        var whsId = req.user.activeStore.Warehouse;
        details = quotation.Details;
        var detailsIds = details.map(function(d){ return d.id; });
        return [
          Company.findOne({id: whsId}),
          QuotationDetail.find({id: detailsIds}).populate('Product')
        ];
      })
      .spread(function(warehouse,details){
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
    Quotation.findOne({id:quotationId})
      .then(function(quotation){
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

  getQuotationSapLogs: function(req, res){
    var form = req.allParams();
    var quotationId = form.id;
    SapOrderConnectionLog.find({Quotation:quotationId})
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
