var Promise = require('bluebird');
var _ = require('underscore');
var assign = require('object-assign');
var moment = require('moment');
var EWALLET_TYPE = 'ewallet';
var EWALLET_NEGATIVE = 'negative';
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

module.exports = {
  create: function(req, res) {
    var form = req.allParams();
    var createdId;

    form.Details = formatProductsIds(form.Details);
    form.Details = form.Details.map(function(d) {
      if (req.user) {
        d.UserWeb = req.user.id;
      }
      return d;
    });
    form.Store = req.activeStore.id;
    if (req.user) {
      form.UserWeb = req.user.id;
      form.Client = req.user.Client;
    }

    var opts = {
      paymentGroup: 1,
      updateDetails: true,
      currentStoreId: req.activeStore.id
    };

    QuotationWeb.create(form)
      .then(function(created) {
        createdId = created.id;
        var calculator = QuotationService.Calculator();
        if (!form.Details || form.Details.length === 0) {
          opts.isEmptyQuotation = true;
        }

        return calculator.updateQuotationTotals(created.id, opts);
      })
      .then(function(updatedQuotation) {
        return Common.nativeFindOne({ _id: ObjectId(createdId) }, QuotationWeb);
      })
      .then(function(quotation) {
        res.json(quotation);
      })
      .catch(function(err) {
        console.log('err create quotation', err);
        res.negotiate(err);
      });
  },

  update: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var userId = UserService.getCurrentUserId(req);
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    form.Store = req.activeStore.id;

    Common.nativeFindOne({ _id: ObjectId(id) }, QuotationWeb)
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        if (req.user) {
          if (quotation.Client !== currentUserClientId && quotation.Client) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }
        return QuotationWeb.update({ id: id }, form);
      })
      .then(function(updatedQuotation) {
        if (updatedQuotation && updatedQuotation.length > 0) {
          res.json(updatedQuotation[0]);
        } else {
          res.json(null);
        }
      })
      .catch(function(err) {
        console.log('err update quotation', err);
        res.negotiate(err);
      });
  },

  updateDetails: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var userId = UserService.getCurrentUserId(req);
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    var details = form.Details;

    form.Store = req.activeStore.id;

    Common.nativeFindOne({ _id: ObjectId(id) }, QuotationWeb)
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        if (req.user) {
          if (quotation.Client !== currentUserClientId && quotation.Client) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }

        var detailsParamsMaps = details.map(function(detail) {
          return {
            id: detail.id,
            shipDate: detail.shipDate,
            originalShipDate: detail.originalShipDate,
            //originalShipDate: detail.originalShipDate,
            quantity: detail.quantity
          };
        });

        var calculator = QuotationService.Calculator();
        return calculator.updateDetails(detailsParamsMaps);
        //return QuotationWeb.update({id:id}, form);
      })
      .then(function(updatedDetails) {
        var opts = {
          paymentGroup: 1,
          updateDetails: true,
          currentStoreId: req.activeStore.id
        };
        var calculator = QuotationService.Calculator();
        return calculator.updateQuotationTotals(id, opts);
        //res.json(true);
      })
      .then(function(updated) {
        res.json(true);
      })
      .catch(function(err) {
        console.log('err update quotation', err);
        res.negotiate(err);
      });
  },

  updateQuotationAddress: function(req, res) {
    var form = req.allParams();
    var quotationId = form.id;
    var params = {
      Address: form.addressId,
      ignoreContactZipcode: false
    };
    var contactId;
    var updatedQuotation;
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    form.Store = req.activeStore.id;

    var query = {
      _id: ObjectId(quotationId),
      Store: ObjectId(req.activeStore.id)
    };

    Common.nativeFindOne(query, QuotationWeb)
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        if (quotation.OrderWeb) {
          return Promise.reject(new Error('Operación no permitida'));
        }

        if (req.user) {
          if (quotation.Client !== currentUserClientId && quotation.Client) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }
        return QuotationWeb.update({ id: quotationId }, params);
      })
      .then(function(resultUpdate) {
        updatedQuotation = resultUpdate[0];
        contactId = updatedQuotation.Address;
        return QuotationService.setQuotationZipcodeDeliveryByContactId(
          quotationId,
          contactId
        );
      })
      .then(function() {
        res.json(updatedQuotation);
      })
      .catch(function(err) {
        console.log('err updateQuotationAddress', err);
        res.negotiate(err);
      });
  },

  findByIdQuickRead: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var query = {
      id: id,
      Store: req.activeStore.id
    };
    var userId = UserService.getCurrentUserId(req);
    var currentUserClientId = UserService.getCurrentUserClientId(req);

    if (req.user && !UserService.isUserAdminOrSeller(req)) {
      query.Client = currentUserClientId;
    }

    //sails.log.info('query', query);

    QuotationWeb.findOne(query)
      .populate('Details')
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }
        if (quotation.Client) {
          if (
            quotation.Client !== currentUserClientId &&
            !UserService.isUserAdminOrSeller(req)
          ) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }
        res.json(quotation);
      })
      .catch(function(err) {
        console.log('err', err);
        res.negotiate(err);
      });
  },

  findById: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var getPayments = form.payments;
    var getAddress = form.address;

    var query = {
      id: id,
      Store: req.activeStore.id
    };
    var userId = UserService.getCurrentUserId(req);
    var currentUserClientId = UserService.getCurrentUserClientId(req);

    if (req.user && !UserService.isUserAdminOrSeller(req)) {
      query.Client = currentUserClientId;
    }

    var quotationQuery = QuotationWeb.findOne(query)
      .populate('Details')
      .populate('Client')
      .populate('ZipcodeDelivery')
      .populate('OrderWeb');
    //.populate('Payments');

    if (getPayments) {
      quotationQuery.populate('Payments');
    }

    if (getAddress) {
      quotationQuery.populate('Address');
    }

    var updateToLatest = QuotationService.updateQuotationToLatestData(id, {
      update: true,
      currentStoreId: req.activeStore.id
    });

    updateToLatest
      .then(function() {
        return quotationQuery;
      })
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        if (quotation.Client) {
          if (
            quotation.Client.id !== currentUserClientId &&
            !UserService.isUserAdminOrSeller(req)
          ) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }

        return res.json(quotation);
      })
      .catch(function(err) {
        console.log('err findById quotation', err);
        return res.negotiate(err);
      });
  },

  getQuotationAddress: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var query = {
      id: id,
      Store: req.activeStore.id,
      select: ['id', 'Client']
    };
    var userId = UserService.getCurrentUserId(req);
    var currentUserClientId = UserService.getCurrentUserClientId(req);

    if (req.user && !UserService.isUserAdminOrSeller(req)) {
      query.Client = currentUserClientId;
    }

    QuotationWeb.findOne(query)
      .populate('Address')
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        if (quotation.Client) {
          if (
            quotation.Client !== currentUserClientId &&
            !UserService.isUserAdminOrSeller(req)
          ) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }

        return res.json(quotation.Address);
      })
      .catch(function(err) {
        console.log('err getQuotationAddress quotation', err);
        return res.negotiate(err);
      });
  },

  addDetail: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var currentUserClientId = UserService.getCurrentUserClientId(req);

    form.QuotationWeb = id;
    form.Details = formatProductsIds(form.Details);
    form.shipDate = moment(form.shipDate)
      .startOf('day')
      .toDate();

    if (req.user) {
      form.Client = currentUserClientId;
    }

    delete form.id;
    var opts = {
      paymentGroup: 1,
      updateDetails: true,
      currentStoreId: req.activeStore.id
    };

    var query = {
      _id: ObjectId(id),
      Store: ObjectId(req.activeStore.id)
    };

    Common.nativeFindOne(query, QuotationWeb)
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        if (quotation.OrderWeb) {
          return Promise.reject(new Error('Operación no permitida'));
        }

        if (req.user) {
          if (quotation.Client !== currentUserClientId) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }
        return QuotationDetailWeb.create(form);
      })
      .then(function(created) {
        var calculator = QuotationService.Calculator();
        if (form.ZipcodeDelivery) {
          //opts.updateParams = ObjectId(form.ZipcodeDelivery);
          opts.updateParams = {
            ZipcodeDelivery: ObjectId(form.ZipcodeDelivery),
            ignoreContactZipcode: true
          };
        }

        return calculator.updateQuotationTotals(id, opts);
      })
      .then(function(updatedQuotation) {
        return QuotationWeb.findOne({ id: id });
      })
      .then(function(quotation) {
        res.json(quotation);
      })
      .catch(function(err) {
        console.log('err addDetail quotation', err);
        res.negotiate(err);
      });
  },

  addMultipleDetails: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    form.QuotationWeb = id;
    form.Details = formatProductsIds(form.Details);

    if (form.Details && form.Details.length > 0 && _.isArray(form.Details)) {
      form.Details = form.Details.map(function(d) {
        d.shipDate = moment(d.shipDate)
          .startOf('day')
          .toDate();
        if (req.user) {
          d.Client = currentUserClientId;
        }
        return d;
      });
    }

    delete form.id;
    var opts = {
      paymentGroup: 1,
      updateDetails: true,
      currentStoreId: req.activeStore.id
    };

    var query = {
      _id: ObjectId(id),
      Store: ObjectId(req.activeStore.id)
    };

    Common.nativeFindOne(query, QuotationWeb)
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        if (quotation.OrderWeb) {
          return Promise.reject(new Error('Operación no permitida'));
        }

        if (quotation.Client) {
          if (quotation.Client !== currentUserClientId) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }
        return QuotationDetailWeb.create(form.Details);
      })
      .then(function(created) {
        var calculator = QuotationService.Calculator();
        if (form.ZipcodeDelivery) {
          opts.updateParams = {
            ZipcodeDelivery: ObjectId(form.ZipcodeDelivery),
            ignoreContactZipcode: true
          };
        }

        return calculator.updateQuotationTotals(id, opts);
      })
      .then(function(updatedQuotation) {
        return QuotationWeb.findOne({ id: id });
      })
      .then(function(quotation) {
        res.json(quotation);
      })
      .catch(function(err) {
        console.log('err addMultipleDetails quotation', err);
        res.negotiate(err);
      });
  },

  removeDetail: function(req, res) {
    var form = req.allParams();
    var detailId = form.detailId;
    var quotationId = form.quotation;
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    var opts = {
      paymentGroup: 1,
      updateDetails: true,
      currentStoreId: req.activeStore.id
    };

    var query = {
      _id: ObjectId(quotationId),
      Store: ObjectId(req.activeStore.id)
    };

    Common.nativeFindOne(query, QuotationWeb)
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        if (quotation.OrderWeb) {
          return Promise.reject(new Error('Operación no permitida'));
        }

        if (quotation.Client) {
          if (quotation.Client !== currentUserClientId) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }

        return QuotationDetailWeb.destroy({ id: detailId });
      })
      .then(function() {
        var calculator = QuotationService.Calculator();
        return calculator.updateQuotationTotals(quotationId, opts);
      })
      .then(function(updatedQuotationResult) {
        return QuotationWeb.findOne({ id: quotationId }).populate('Details');
      })
      .then(function(quotation) {
        res.json(quotation);
      })
      .catch(function(err) {
        console.log('err removeDetailsGroup', err);
        res.negotiate(err);
      });
  },

  async removeAllDetails(req, res) {
    var form = req.allParams();
    var detailId = form.detailId;
    var quotationId = form.quotation;
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    var opts = {
      paymentGroup: 1,
      updateDetails: true,
      currentStoreId: req.activeStore.id
    };

    var query = {
      _id: ObjectId(quotationId),
      Store: ObjectId(req.activeStore.id)
    };

    Common.nativeFindOne(query, QuotationWeb)
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        if (quotation.OrderWeb) {
          return Promise.reject(new Error('Operación no permitida'));
        }

        if (quotation.Client) {
          if (quotation.Client !== currentUserClientId) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }

        return QuotationDetailWeb.destroy({ QuotationWeb: quotationId });
      })
      .then(function() {
        var calculator = QuotationService.Calculator();
        return calculator.updateQuotationTotals(quotationId, opts);
      })
      .then(function(updatedQuotationResult) {
        return QuotationWeb.findOne({ id: quotationId }).populate('Details');
      })
      .then(function(quotation) {
        res.json(quotation);
      })
      .catch(function(err) {
        console.log('err removeDetailsGroup', err);
        res.negotiate(err);
      });
  },

  removeDetailsGroup: function(req, res) {
    var form = req.allParams();
    var detailsIds = form.detailsIds;
    var quotationId = form.quotation;
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    var opts = {
      paymentGroup: 1,
      updateDetails: true,
      currentStoreId: req.activeStore.id
    };

    var query = {
      _id: ObjectId(quotationId),
      Store: ObjectId(req.activeStore.id)
    };

    Common.nativeFindOne(query, QuotationWeb)
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        if (quotation.OrderWeb) {
          return Promise.reject(new Error('Operación no permitida'));
        }

        if (quotation.Client) {
          if (quotation.Client !== currentUserClientId) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }

        return QuotationDetailWeb.destroy({ id: detailsIds });
      })
      .then(function() {
        var calculator = QuotationService.Calculator();
        return calculator.updateQuotationTotals(quotationId, opts);
      })
      .then(function(updatedQuotationResult) {
        return QuotationWeb.findOne({ id: quotationId }).populate('Details');
      })
      .then(function(quotation) {
        res.json(quotation);
      })
      .catch(function(err) {
        console.log('err removeDetailsGroup', err);
        res.negotiate(err);
      });
  },

  find: function(req, res) {
    var form = req.allParams();
    var clientId = UserService.getCurrentUserClientId(req);
    form.filters = form.filters || {};
    form.filters.Client = clientId;
    //form.filters.Store = req.activeStore.id;

    var model = 'quotationweb';
    var extraParams = {
      searchFields: ['folio', 'id'],
      selectFields: form.fields,
      filters: form.filters
    };

    Common.find(model, form, extraParams)
      .then(function(result) {
        res.ok(result);
      })
      .catch(function(err) {
        console.log('err find quotation', err);
        res.negotiate(err);
      });
  },

  findAll: function(req, res) {
    var form = req.allParams();
    var clientId = UserService.getCurrentUserClientId(req);
    form.filters = form.filters || {};
    //form.filters.Store = req.activeStore.id;

    var model = 'quotationweb';
    var extraParams = {
      searchFields: ['folio', 'id'],
      selectFields: form.fields,
      filters: form.filters,
      populateFields: ['Client']
    };

    extraParams.filters = Common.removeUnusedFilters(extraParams.filters);

    var clientSearch = form.clientSearch;
    var clientSearchFields = ['CardName', 'E_Mail', 'CardCode'];
    var preSearch = Promise.resolve();

    if (clientSearch && form.term) {
      preSearch = ClientService.clientsIdSearch(form.term, clientSearchFields);
      delete form.term;
    }

    if (form.clientSearchTerm) {
      preSearch = ClientService.clientsIdSearch(
        form.clientSearchTerm,
        clientSearchFields
      );
      delete form.clientSearchTerm;
    }

    preSearch
      .then(function(preSearchResults) {
        //Search by pre clients search
        if (preSearchResults && _.isArray(preSearchResults)) {
          extraParams.filters.Client = preSearchResults;
        }

        return Common.find(model, form, extraParams);
      })
      .then(function(result) {
        res.ok(result);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  getQuotationTotals: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var paymentGroup = form.paymentGroup || 1;
    var params = {
      update: false,
      paymentGroup: paymentGroup,
      currentStoreId: req.activeStore.id
    };
    var calculator = QuotationService.Calculator();

    var query = {
      _id: ObjectId(id),
      Store: ObjectId(req.activeStore.id)
    };

    Common.nativeFindOne(query, QuotationWeb)
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        /*
        if(quotation.User !== req.user.id){
          return Promise.reject(new Error('Esta cotización no corresponde al usuario activo'));
        }
        */

        return calculator.getQuotationTotals(id, params);
      })
      .then(function(totals) {
        res.json(totals);
      })
      .catch(function(err) {
        console.log('err getQuotationTotals', err);
        res.negotiate(err);
      });
  },

  sendEmail: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    var query = {
      _id: ObjectId(id),
      Store: ObjectId(req.activeStore.id)
    };

    Common.nativeFindOne(query, QuotationWeb)
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        if (quotation.Client !== currentUserClientId) {
          return Promise.reject(
            new Error('Esta cotización no corresponde al usuario activo')
          );
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

  getCurrentStock: function(req, res) {
    var form = req.allParams();
    var quotationId = form.quotationId;
    var details;
    var quotation;
    var queryDetails = {
      QuotationWeb: quotationId
    };

    var queryQuotation = {
      id: quotationId,
      Store: req.activeStore.id,
      select: ['ZipcodeDelivery']
    };
    /*
    if(req.user){
      query.Client = req.user.id;
    }else{
      query.Client = null;
    }
    */

    var promises = [
      QuotationWeb.findOne(queryQuotation),
      QuotationDetailWeb.find(queryDetails).populate('Product')
    ];

    Promise.all(promises)
      .then(function(results) {
        quotation = results[0];
        details = results[1];
        var whsId = req.activeStore.Warehouse;

        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        return Company.findOne({ id: whsId });
      })
      .then(function(warehouse) {
        var zipcodeDeliveryId = quotation.ZipcodeDelivery;
        var activeStore = req.activeStore;
        return StockService.getDetailsStock(
          details,
          warehouse,
          zipcodeDeliveryId,
          activeStore
        );
      })
      .then(function(results) {
        res.json(results);
      })
      .catch(function(err) {
        console.log('err getCurrentStock', err);
        res.negotiate(err);
      });
  },

  validateStock: function(req, res) {
    var form = req.allParams();
    var quotationId = form.id;
    StockService.validateQuotationStockById(quotationId, req)
      .then(function(isValid) {
        return res.json({ isValid: isValid });
      })
      .catch(function(err) {
        console.log('err validateStock', err);
        res.negotiate(err);
      });
  },

  getQuotationPaymentOptions: function(req, res) {
    var form = req.allParams();
    var quotationId = form.id;
    var currentUserClientId = UserService.getCurrentUserClientId(req);
    var query = {
      _id: ObjectId(quotationId),
      Store: ObjectId(req.activeStore.id)
    };

    Common.nativeFindOne(query, QuotationWeb)
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }

        if (quotation.Client) {
          if (
            quotation.Client !== currentUserClientId &&
            !UserService.isUserAdminOrSeller(req)
          ) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }

        var options = {
          financingTotals: form.financingTotals || false,
          rateLimitReported: quotation.rateLimitReported
        };

        return PaymentService.getMethodGroupsWithTotals(
          quotationId,
          req.activeStore,
          options
        );
      })
      .then(function(paymentOptions) {
        res.json(paymentOptions);
      })
      .catch(function(err) {
        console.log('err getQuotationPaymentOptions', err);
        res.negotiate(err);
      });
  },

  getQuotationPayments: function(req, res) {
    var form = req.allParams();
    var quotationId = form.id;
    var query = {
      QuotationWeb: quotationId
    };
    PaymentWeb.find(query)
      .then(function(payments) {
        res.json(payments);
      })
      .catch(function(err) {
        console.log('err getQuotationPayments', err);
        res.negotiate(err);
      });
  },

  getQuotationSapLogs: function(req, res) {
    var form = req.allParams();
    var quotationId = form.id;
    var query = {
      QuotationWeb: quotationId
    };

    SapOrderConnectionLogWeb.find(query)
      .then(function(logs) {
        res.json(logs);
      })
      .catch(function(err) {
        console.log('err getQuotationSapLogs', err);
        res.negotiate(err);
      });
  },

  getQuotationZipcodeDelivery: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var query = {
      id: id,
      Store: req.activeStore.id
    };
    var currentUserClientId = UserService.getCurrentUserClientId(req);

    if (req.user) {
      query.Client = currentUserClientId;
    }

    QuotationWeb.findOne(query)
      .populate('ZipcodeDelivery')
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }
        if (quotation.Client) {
          if (quotation.Client !== currentUserClientId) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }
        res.json(quotation.ZipcodeDelivery);
      })
      .catch(function(err) {
        console.log('err getQuotationZipcodeDelivery', err);
        res.negotiate(err);
      });
  },

  getQuotationPaymentsAttempts: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    var query = {
      id: id,
      Store: req.activeStore.id,
      select: ['paymentAttempts']
    };
    var currentUserClientId = UserService.getCurrentUserClientId(req);

    if (req.user) {
      query.Client = currentUserClientId;
    }

    QuotationWeb.findOne(query)
      .then(function(quotation) {
        if (!quotation) {
          return Promise.reject(new Error('Cotización no encontrada'));
        }
        if (quotation.Client) {
          if (quotation.Client !== currentUserClientId) {
            return Promise.reject(
              new Error('Esta cotización no corresponde al usuario activo')
            );
          }
        }
        res.json(quotation.paymentAttempts);
      })
      .catch(function(err) {
        console.log('err getQuotationZipcodeDelivery', err);
        res.negotiate(err);
      });
  },

  getQuotationLeads: function(req, res) {
    var form = req.allParams();
    var quotationId = form.quotationId;

    Lead.find({ QuotationWeb: quotationId })
      .then(function(leads) {
        res.json(leads);
      })
      .catch(function(err) {
        console.log('getQuotationLeads err', err);
        res.negotiate(err);
      });
  }
};

function tagImmediateDeliveriesDetails(details) {
  if (details && details.length > 0) {
    for (var i = 0; i < details.length; i++) {
      if (isImmediateDelivery(details[i].shipDate)) {
        details[i].immediateDelivery = true;
      }
    }
    return details;
  }
  return [];
}

function isImmediateDelivery(shipDate) {
  var currentDate = moment().format();
  shipDate = moment(shipDate).format();
  return currentDate === shipDate;
}

function formatProductsIds(details) {
  var result = [];
  if (details && details.length > 0) {
    result = details.map(function(d) {
      if (d.Product) {
        d.Product = typeof d.Product == 'string' ? d.Product : d.Product.id;
      }
      return d;
    });
  }
  return result;
}
