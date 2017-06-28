var Promise = require('bluebird');
var _       = require('underscore');
var assign  = require('object-assign');
var moment  = require('moment');
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;


var BIGTICKET_TABLE = [
  {min:100000, max:199999.99, maxPercentage:2},
  {min:200000, max:349999.99, maxPercentage:3},
  {min:350000, max:499999.99, maxPercentage:4},
  {min:500000, max:Infinity, maxPercentage:5},
];

var DISCOUNT_KEYS = [
  'discountPg1',
  'discountPg2',
  'discountPg3',
  'discountPg4',
  'discountPg5'
];

var EWALLET_KEYS = [
  'ewalletPg1',
  'ewalletPg2',
  'ewalletPg3',
  'ewalletPg4',
  'ewalletPg5'
];

var EWALLET_TYPES_KEYS = [
  'ewalletTypePg1',
  'ewalletTypePg2',
  'ewalletTypePg3',
  'ewalletTypePg4',
  'ewalletTypePg5'
];

var defaultQuotationTotals = {
    subtotal :0,
    subtotal2:0,
    total:0,
    discount:0,
    totalProducts: 0,
    paymentGroup: 1,
    immediateDelivery: false
};

module.exports = {
  Calculator     : Calculator,
  nativeQuotationUpdate: nativeQuotationUpdate,
  updateQuotationToLatestData: updateQuotationToLatestData,
  getCountByUser: getCountByUser,
  getTotalsByUser: getTotalsByUser,
  setQuotationZipcodeDeliveryByContactId: setQuotationZipcodeDeliveryByContactId
};

function updateQuotationToLatestData(quotationId, options){
  var params = {
    paymentGroup: options.paymentGroup || 1,
    updateDetails: true,
    currentStoreId: options.currentStoreId,
    isEmptyQuotation: options.isEmptyQuotation
  };

  if(options.isEmptyQuotation){
    return nativeQuotationUpdate(quotationId, defaultQuotationTotals);
  }
    
  var findCrieria = {_id: new ObjectId(quotationId)};       

  return Common.nativeFindOne(findCrieria, QuotationWeb)
    .then(function(quotation){
      if(!quotation){
        return Promise.reject(new Error('Cotización no encontrada'));
      }

      return setQuotationZipcodeDeliveryByContactId(quotation.id, quotation.Address);
    })
    .then(function(){
      var calculator = Calculator();
      return calculator.updateQuotationTotals(quotationId, params);
    });
}


function Calculator(){
  var activePromotions = [];
  var storePackages   = [];
  var packagesRules   = [];

  function updateQuotationTotals(quotationId, options){
    options = options || {paymentGroup:1 , updateDetails: true};
    options = _.extend(options,{
      financingTotals: true
    });

    var quotationTotals;

    if(options.isEmptyQuotation){
      return nativeQuotationUpdate(quotationId, defaultQuotationTotals);
    }

    return getQuotationTotals(quotationId, options)
      .then(function(totals){
        if(options && options.updateParams){
          totals = _.extend(totals, options.updateParams);
        }
        quotationTotals = totals;
        return nativeQuotationUpdate(quotationId, quotationTotals);
      });
  }


  function getQuotationTotals(quotationId, options){
    var details = [];
    var quotation;
    options = options || {paymentGroup:1 , updateDetails: true};

    return getActivePromos()
      .then(function(promos){
        activePromotions = promos;
        return QuotationWeb.findOne({id:quotationId}).populate('Details');
      })
      .then(function(quotationFound){
        quotation = quotationFound; 
        details = quotation.Details;
        var packagesIds = getQuotationPackagesIds(details);

        if(packagesIds.length > 0){
          return [
            getPackagesByStoreId(options.currentStoreId),
            ProductGroup.find({id:packagesIds})
              .populate('PackageRules')
          ];
        }

        return [ [], false ];
      })
      .spread(function(storePackagesFound, promotionPackages){
        storePackages = storePackagesFound;
        packagesRules = getAllPackagesRules(promotionPackages, details);
        return processQuotationDetails(details, options);
      })
      .then(function(processedDetails){
        var totals = sumProcessedDetails(processedDetails, options);
        var ammountPaidPg1 = quotation.ammountPaidPg1 || 0;
        var auxPromise = Promise.resolve();

        if( ammountPaidPg1 > 0 && options.financingTotals){

          processedDetails = mapDetailsWithFinancingCost(processedDetails, ammountPaidPg1, totals);
          totals = sumProcessedDetails(processedDetails, options);

          if(options.updateDetails){
            auxPromise = updateDetails(processedDetails);
          }
        }

        return [
          totals,
          auxPromise
        ];
      })
      .spread(function(totals, resultUpdateIfNeeeded){
        return totals;
      });

  }

  function mapDetailsWithFinancingCost(details, ammountPaidPg1, quotationPlainTotals){
    return details.map(function(detail){
      var proportionalPaymentPg1 = (detail.totalPg1 / quotationPlainTotals.totalPg1) * ammountPaidPg1;
      var proportionalPayment = (detail.total / quotationPlainTotals.total) * ammountPaidPg1;
      
      var detailRemainingPg1 = detail.totalPg1 - proportionalPaymentPg1;
      var detailRemaining = (1+detail.financingCostPercentage) * detailRemainingPg1;
      
      detail.originalDiscountPercent = _.clone(detail.discountPercent);
      detail.total                 = proportionalPayment + detailRemaining;
      detail.discount              = detail.total - detail.subtotal;
      detail.discountPercent       = 100 - ((detail.total / detail.subtotal) * 100);
      detail.unitPriceWithDiscount = calculateAfterDiscount(detail.unitPrice, detail.discountPercent);
      detail.discountPercentPromos = detail.discountPercentPromos;
      return detail;
    });
  }

  function sumProcessedDetails(processedDetails, options){
    var totals = {
      subtotal :0,
      subtotal2:0,
      total:0,
      totalPg1: 0,
      totalPg2: 0,
      totalPg3: 0,
      totalPg4: 0,
      totalPg5: 0,
      discountPg1: 0,
      discountPg2: 0,
      discountPg3: 0,
      discountPg4: 0,
      discountPg5: 0,

      discount:0,
      totalProducts: 0,
      paymentGroup: options.paymentGroup,
    };

    processedDetails.forEach(function(pd){
      totals.totalPg1      += pd.totalPg1;
      totals.totalPg2      += pd.totalPg2;
      totals.totalPg3      += pd.totalPg3;
      totals.totalPg4      += pd.totalPg4;
      totals.totalPg5      += pd.totalPg5;

      totals.discountPg1      += (pd.subtotal - pd.totalPg1);
      totals.discountPg2      += (pd.subtotal - pd.totalPg2);
      totals.discountPg3      += (pd.subtotal - pd.totalPg3);
      totals.discountPg4      += (pd.subtotal - pd.totalPg4);
      totals.discountPg5      += (pd.subtotal - pd.totalPg5);

      totals.total         += pd.total;
      totals.subtotal      += pd.subtotal;
      totals.subtotal2     += pd.subtotal2;
      totals.discount      += (pd.subtotal - pd.total);
      totals.totalProducts += pd.quantity;
    });    

    totals.financingCostPercentage = calculateFinancingPercentage(totals.totalPg1, totals.total);

    return totals;
  }

  function getActivePromos(){
    var queryPromos = Search.getPromotionsQuery();
    return Promotion.find(queryPromos)
      .then(function(promos){
        return promos;
      });
  }


  function getQuotationPackagesIds(details){
    var packages = [];
    for (var i=0;i<details.length;i++){
      if(details[i].PromotionPackage){
        packages.push( details[i].PromotionPackage ) ;
      }
    }
    return _.uniq(packages);
  }

  function getPackagesByStoreId(storeId){
    var queryPromos = Search.getPromotionsQuery();
    return Store.findOne({id:storeId})
      .populate('PromotionPackages', queryPromos)
      .then(function(store){
        if(store){
          return store.PromotionPackages;
        }
        return [];
      });
  }

  function getAllPackagesRules(promotionPackages, details){
    var filteredPackages = filterPromotionPackages(promotionPackages, details);
    var rules             = [];
    for(var i=0;i<filteredPackages.length;i++){
      rules = rules.concat(filteredPackages[i].PackageRules);
    }
    return rules;
  }

  function filterPromotionPackages(promotionPackages, details){
    var filtered = [];
    for(var i=0;i<promotionPackages.length;i++){
      if(isValidPromotionPackage(promotionPackages[i], details)){
        filtered.push(promotionPackages[i]);
      }
    }
    return filtered;
  }

  function isValidPromotionPackage(promotionPackage, details){
    if(promotionPackage && promotionPackage.id){
      if (
        isAStorePackage(promotionPackage.id) && 
        validatePackageRules(promotionPackage.PackageRules, details) 
      ){
        return true;
      }
    }
    return false;
  }

  function isAStorePackage(promotionPackageId){
    return _.findWhere(storePackages, {id: promotionPackageId});
  }

  function validatePackageRules(rules, details){
    var validFlag = true;
    var rulesValidated = 0;
    for(var i = 0; i < rules.length; i++){
      var rule = rules[i];
      if(!isValidPackageRule(rule, details)){
        validFlag = false;
      }
      rulesValidated++;    
    }
    if(rulesValidated < rules.length){
      validFlag = false;
    }
    return validFlag;
  }

  //@param quotation: 
  //  Every detail must contain a Product object populated
  function processQuotationDetails(details, options){
    options = options || {paymentGroup:1};
    return Promise.mapSeries(details, function(detail){
      return getDetailTotals(detail, options);      
    })
      .then(function(pDetails){
        if(options.updateDetails){
          return updateDetails(pDetails);
        }else{
          return pDetails;
        }
      });
  }

  function calculateAfterDiscount(amount,discountPercentage){
    var result = amount - ( ( amount / 100) * discountPercentage );
    return result;
  }

  function getEwalletEntryByDetail(options){
    var ewalletEntry = 0;

    if(options.Promotion && !options.Promotion.PromotionPackage){
      var paymentGroup = options.paymentGroup || 1;
      var eKey         = paymentGroup - 1;
      var ewallet      = options.Promotion[ EWALLET_KEYS[eKey] ];
      var ewalletType  = options.Promotion[ EWALLET_TYPES_KEYS[eKey] ];

      if(ewalletType === 'ammount'){
        ewalletEntry = options.total - ewallet;
      }else{
        ewalletEntry = ( options.total / 100) * ewallet;
      }
    }
    return ewalletEntry;
  }  

  //@params: detail Object from model Detail
  //Must contain a Product object populated
  function getDetailTotals(detail, options){
    options = options || {};
    var paymentGroup = options.paymentGroup || 1;
    var productId   = detail.Product;
    var quantity    = detail.quantity;
    var quotationId = detail.Quotation;
    var product;
    
    return Product.findOne({id:productId})
      .then(function(productResult){
        product = productResult;
        return getProductMainPromo(product, quantity, quotationId);
      })
      .then(function(mainPromo){
        var unitPrice                 = product.Price;
        var discountKey               = getDiscountKey(options.paymentGroup);
        var discountPercent           = mainPromo ? mainPromo[discountKey] : 0;
        var discountPercentPromos     = discountPercent;
        var unitPriceWithDiscount     = calculateAfterDiscount(unitPrice, discountPercent);
        var subtotal                  = quantity * unitPrice;
        var subtotal2                 = quantity * unitPriceWithDiscount;
        var total                     = quantity * unitPriceWithDiscount;
        var totalPg1                  = total;
        var financingCostPercentage   = 0;
        var discountName              = mainPromo ? getPromotionOrPackageName(mainPromo) : null;

        //var total                 = quantity * unitPriceWithDiscount;
        var discount                  = total - subtotal;

        //TODO: Reactivate ewallet 
        var ewallet                   = 0;


        //Calculate financing
        if(mainPromo){
          var _discountKey = getDiscountKey(1);
          var _discountPercent = mainPromo[_discountKey] || 0;
          var _unitPriceWithDiscount = calculateAfterDiscount(unitPrice, _discountPercent);
          totalPg1 = _unitPriceWithDiscount * quantity;
          financingCostPercentage = calculateFinancingPercentage(totalPg1, total);
        }

        /*
        var ewallet = getEwalletEntryByDetail({
          Promotion: mainPromo,
          paymentGroup: options.paymentGroup,
          total: total
        });
        */

        var detailTotals = {
          discount                    : discount,
          discountKey                 : discountKey, //Payment group discountKey
          discountPercentPromos       : discountPercentPromos, //discount without BT or FF
          discountPercent             : discountPercent,
          discountName                : discountName,
          ewallet                     : ewallet,
          id                          : detail.id,
          isFreeSale                  : StockService.isFreeSaleProduct(product),
          paymentGroup                : options.paymentGroup,
          PromotionPackageApplied     : null,
          quantity                    : quantity,
          subtotal                    : subtotal,
          subtotal2                   : subtotal2,
          total                       : total,
          totalPg1                    : totalPg1,
          financingCostPercentage     : financingCostPercentage,
          unitPrice                   : unitPrice,
          unitPriceWithDiscount       : unitPriceWithDiscount,
          immediateDelivery           : Shipping.isDateImmediateDelivery(detail.shipDate),
        };

        if(mainPromo.id && !mainPromo.PromotionPackage && !mainPromo.clientDiscountReference){
          detailTotals.Promotion = mainPromo.id;
        }

        else if(mainPromo.PromotionPackage){
          mainPromo.discountApplied = true;
          detailTotals.PromotionPackageApplied = mainPromo.PromotionPackage;
        }
        
        else if(mainPromo.clientDiscountReference){
          detailTotals.clientDiscountReference = mainPromo.clientDiscountReference;
        }

        var totalsGroups = calculateAllTotalsGroups(mainPromo, unitPrice, quantity);
        //sails.log.info('totalsGroups', totalsGroups);
        detailTotals = _.extend(detailTotals, totalsGroups);

        return detailTotals;
      });
  }

  function calculateAllTotalsGroups(mainPromo, unitPrice, quantity){

    var totalsGroups = _.reduce([1,2,3,4,5], function(acum,group){
      var _discountKey = getDiscountKey(group);
      var _discountPercent = mainPromo[_discountKey] || 0;
      var _unitPriceWithDiscount = calculateAfterDiscount(unitPrice, _discountPercent);
      var totalPg = _unitPriceWithDiscount * quantity;
      var subtotalPg = unitPrice * quantity;
      acum['totalPg' + group] = totalPg;
      acum['discountPg' + group] = totalPg - subtotalPg;
      return acum;
    },{});

    return totalsGroups;
  }

  function calculateFinancingPercentage(totalPg1, total){
    return (total - totalPg1) / totalPg1;
  }

  function getPromotionOrPackageName(promotionOrPackage){
    var promotionFound = _.findWhere(activePromotions, {id:promotionOrPackage.id});
    if(promotionFound){
      return promotionOrPackage.publicName;
      //return promotionFound.publicName;
    }

    var packageFound = _.findWhere(storePackages, {id:promotionOrPackage.PromotionPackage});
    if(packageFound){
      return packageFound.Name;
    }

    return null;
  }

  function calculateDiscountPercent(subtotal, total){
    var discountPercent = 0;
    discountPercent = ( ((total / subtotal) - 1) * 100 ) * -1;
    return discountPercent;
  }

  function getQuotationBigticketPercentage(quotation){
    var percentage = 0;
    subtotal2 = quotation.subtotal2 || 0;
    if(quotation.bigticketPercentage && 
      (quotation.bigticketPercentage <= getBigticketMaxPercentage(subtotal2))
    ){
       percentage = quotation.bigticketPercentage;
    }

    return percentage;
  }


  //@params product Object from model Product
  //Populated with promotions
  function getProductMainPromo(product, quantity, quotationId){
    var packageRule = getDetailPackageRule(product.id, quantity);
    var promotions = [];
    return PromotionService.getProductActivePromotions(product, activePromotions, quotationId)
      .then(function(productActivePromotions){
        promotions = productActivePromotions;

        //Taking package rule as a promotion
        if(packageRule){

          //Remove client promotions if there is a package rule 
          //promotions = PromotionService.removeSpecialClientPromotions(promotions);

          //promotions = promotions.concat([packageRule]);

          //Take package promotion as unique
          promotions = [packageRule];
        }
        return PromotionService.getPromotionWithHighestDiscount(promotions);
      });
  }

  function isPackageDiscountApplied(){
    return _.findWhere(packagesRules, {discountApplied:true});
  }

  function getDetailPackageRule(productId, quantity){
    if(packagesRules.length > 0){
      var query = {
        Product : productId,
        quantity: quantity
      };
      var detailRuleMatch = false;
      var matches         = _.where(packagesRules, query);
      matches = matches.filter(function(m){
        return !m.validated;
      });
      detailRuleMatch = matches[0] || false;
      if( detailRuleMatch && !detailRuleMatch.validated){    
        detailRuleMatch.validated = true;
        return detailRuleMatch;
      }
    }
    return false;
  }

  function updateDetails(details){
    return Promise.mapSeries(details, function(d){
      return updateDetail(d).then(function(updated){
        if(updated && updated.length > 0){
          return updated[0];
        }
        return null;
      });
    });
  }

  function updateDetail(detail){
    return QuotationDetailWeb.update({id: detail.id}, detail);
  }


  function getDiscountKey(group){
    return DISCOUNT_KEYS[group-1];
  }


  function isValidPackageRule(rule, details){
    var isValidRule = _.find(details, function(detail){
      if(detail.Product === rule.Product && detail.quantity === rule.quantity && !detail.validated){
        detail.validated = true;
        return true;
      }
      return false;
    });
    return isValidRule;  
  }

  return {
    getQuotationTotals: getQuotationTotals,
    updateQuotationTotals: updateQuotationTotals
  };
}

function nativeQuotationUpdate(quotationId,params){
  return new Promise(function(resolve, reject){
    QuotationWeb.native(function(err, collection){
      if(err){
        console.log('err updating quotation',err);
        reject(err);
      }
      var findCrieria = {_id: new ObjectId(quotationId)};
      params.updatedAt = new Date();
      var updateParams = {
        $set: _.omit(params, ['id'])
      };
      collection.updateOne(findCrieria, updateParams, function(errUpdate, result){
        if(errUpdate){
          console.log('errUpdate updating product',errUpdate);
          reject(errUpdate);
        }
        resolve(result);
      });
    });
  });
}

function setQuotationZipcodeDeliveryByContactId(quotationId,contactId){

  if(!contactId){
    return Promise.resolve();
  }

  return ClientContact.findOne({id:contactId})
    .then(function(contact){
      var cp = contact.U_CP;
      if(!cp){
        return Promise.reject(new Error("La dirección de entrega no tiene un código postal asignado"));
      }
      return ZipcodeDelivery.findOne({cp:cp});  
    })
    .then(function(zipcodeDelivery){
      var zipcodeDeliveryId = zipcodeDelivery.id;
      var findCriteria = {_id: ObjectId(quotationId)};
      var params = {ZipcodeDelivery: ObjectId(zipcodeDeliveryId)};
      return Common.nativeUpdateOne(findCriteria, params, QuotationWeb);
    })
}

function getMultipleUsersTotals(options){
  var usersIds = options.usersIds;
  return Promise.map(usersIds,function(uid){
    var _opts = _.extend(options,{
      userId: uid
    });

    return getTotalsByUser(_opts)
      .then(function(totals){
        var user = {
          id: uid,
          totals: totals
        };
      });
  });
}

function getTotalsByUser(options){
  var userId    = options.userId;
  var todayDate = moment().endOf('day').toDate(); 
  var isClosed  = options.isClosed;


  if(_.isUndefined(options.endDate)){
    options.endDate = todayDate;
  }

  var startDate = options.startDate;
  var endDate   = options.endDate;
  var dateField = options.dateField || 'createdAt'; 
  
  var queryUntilToday = {User: userId};
  queryUntilToday[dateField] = {
    '<=': todayDate
  };

  var queryByDateRange = {User: userId};
  queryByDateRange[dateField] = {};

  if(startDate){
    startDate = moment(startDate).startOf('day').toDate(); 
    queryUntilToday[dateField] = assign(queryUntilToday[dateField],{
      '>=': startDate
    });
    queryByDateRange[dateField] = assign(queryByDateRange[dateField],{
      '>=': startDate
    });
  }

  if(endDate){
    endDate = moment(endDate).endOf('day').toDate(); 
    queryByDateRange[dateField] = assign(queryByDateRange[dateField],{
      '<=': endDate
    });
  }

  if( _.isEmpty(queryByDateRange[dateField]) ){
    delete queryByDateRange[dateField];
  }

  var queryAllByDateRange = _.clone(queryByDateRange);

  if(isClosed){
    queryUntilToday.isClosed   = isClosed;
    queryByDateRange.isClosed  = isClosed;  
  }

  //sails.log.info('query untilToday', queryUntilToday);
  //sails.log.info('queryByDateRange', queryByDateRange);
  //sails.log.info('queryAllByDateRange', queryAllByDateRange);

  var props = {
    totalUntilToday: QuotationWeb.find(queryUntilToday).sum('total'),
    totalByDateRange: QuotationWeb.find(queryByDateRange).sum('total'),
    totalByDateRangeAll: QuotationWeb.find(queryAllByDateRange).sum('total')
  };

  return Promise.props(props)
    .then(function(result){
      var resultUntilToday = result.totalUntilToday[0] || {};
      var resultByDateRange = result.totalByDateRange[0] || {};
      var resultAllByDateRange = result.totalByDateRangeAll[0] || {};


      var totalUntilToday = resultUntilToday.total || 0;
      var totalByDateRange = resultByDateRange.total || 0;
      var totalByDateRangeAll = resultAllByDateRange.total || 0;
      
      return {
        untilToday: totalUntilToday,
        byDateRange: totalByDateRange,
        allByDateRange: totalByDateRangeAll       
      };
    });
}

function getCountByUser(options){
  var userId    = options.userId;
  var todayDate = moment().endOf('day').toDate(); 
  var isClosed  = options.isClosed;

  if(_.isUndefined(options.endDate)){
    options.endDate = todayDate;
  }

  var startDate = options.startDate;
  var endDate   = options.endDate;
  var dateField = options.dateField || 'createdAt'; 
  
  var queryUntilToday = {User: userId};
  queryUntilToday[dateField] = {
    '<=': todayDate
  };

  var queryByDateRange = {User: userId};
  queryByDateRange[dateField] = {};

  if(startDate){
    startDate = moment(startDate).startOf('day').toDate(); 
    queryUntilToday[dateField] = assign(queryUntilToday[dateField],{
      '>=': startDate
    });
    queryByDateRange[dateField] = assign(queryByDateRange[dateField],{
      '>=': startDate
    });
  }

  if(endDate){
    endDate = moment(endDate).endOf('day').toDate(); 
    queryByDateRange[dateField] = assign(queryByDateRange[dateField],{
      '<=': endDate
    });
  }

  if( _.isEmpty(queryByDateRange[dateField]) ){
    delete queryByDateRange[dateField];
  }

  var queryAllByDateRange = _.clone(queryByDateRange);

  if(isClosed){
    queryUntilToday.isClosed   = isClosed;
    queryByDateRange.isClosed  = isClosed;
  }

  return Promise.props({
    countUntilToday: QuotationWeb.count(queryUntilToday),
    countByDateRange: QuotationWeb.count(queryByDateRange),
    countAllByDateRange: QuotationWeb.count(queryAllByDateRange)
  })
    .then(function(result){
      return {
        untilToday: result.countUntilToday,
        byDateRange: result.countByDateRange,
        allByDateRange: result.countAllByDateRange
      };
    });
}