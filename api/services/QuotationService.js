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
  getTotalsByUser: getTotalsByUser
};

function updateQuotationToLatestData(quotationId, userId, options){
  var params = {
    paymentGroup:1,
    updateDetails: true,
    currentStore: options.currentStore,
    isEmptyQuotation: options.isEmptyQuotation
  };

  if(options.isEmptyQuotation){
    return nativeQuotationUpdate(quotationId, defaultQuotationTotals);
  }
    
  //return Quotation.findOne({id:quotationId,select:['paymentGroup']})
  return nativeQuotationFindOne(quotationId)
    .then(function(quotation){
      if(!quotation){
        return Promise.reject(new Error('Cotización no encontrada'));
      }
      params.paymentGroup = quotation.paymentGroup || 1;
      var calculator = Calculator();
      return calculator.updateQuotationTotals(quotationId, params);
    });
}

function getBigticketMaxPercentage(subtotal2){
  var maxPercentage = 0;
  for(var i=0;i<BIGTICKET_TABLE.length;i++){
    if(subtotal2 >= BIGTICKET_TABLE[i].min && subtotal2 <= BIGTICKET_TABLE[i].max){
      maxPercentage = BIGTICKET_TABLE[i].maxPercentage;
    }
  }
  return maxPercentage;
}


function Calculator(){
  var activePromotions = [];
  var storePackages   = [];
  var packagesRules   = [];

  function updateQuotationTotals(quotationId, options){
    options = options || {paymentGroup:1 , updateDetails: true};

    if(options.isEmptyQuotation){
      return nativeQuotationUpdate(quotationId, defaultQuotationTotals);
    }

    return getQuotationTotals(quotationId, options)
      .then(function(totals){
        
        if(options && options.updateParams){
          totals = _.extend(totals, options.updateParams);
        }
        return nativeQuotationUpdate(quotationId, totals);
      });
  }


  function getQuotationTotals(quotationId, options){
    var details = [];
    options = options || {paymentGroup:1 , updateDetails: true};

    return getActivePromos()
      .then(function(promos){
        activePromotions = promos;
        return Common.nativeFind({Quotation: ObjectId(quotationId)}, QuotationDetail);
        //return QuotationDetail.find({Quotation: quotationId});
      })
      .then(function(detailsResult){
        //sails.log.info('detailsResult', detailsResult);
        details = detailsResult; 
        var packagesIds = getQuotationPackagesIds(details);

        if(packagesIds.length > 0){
          return [
            getPackagesByStore(options.currentStore),
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
        return totals;
      });

  }

  function sumProcessedDetails(processedDetails, options){
    var totals = {
      subtotal :0,
      subtotal2:0,
      total:0,
      discount:0,
      totalProducts: 0,
      paymentGroup: options.paymentGroup,
      immediateDelivery: processedDetails.every(function(detail){
        return detail.immediateDelivery;
      })
    };

    processedDetails.forEach(function(pd){
      totals.total         += pd.total;
      totals.subtotal      += pd.subtotal;
      totals.subtotal2     += pd.subtotal2;
      totals.discount      += (pd.subtotal - pd.total);
      totals.totalProducts += pd.quantity;
    });    
    
    return totals;
  }

  function getActivePromos(){
    var queryPromos = Search.getPromotionsQuery();
    return Promotion.find(queryPromos)
      .then(function(promos){
        return promos;
      });
  }

  function getPromosByStore(storeId){
    var currentDate = new Date();
    var queryPromos = Search.getPromotionsQuery();
    return Store.findOne({id:storeId})
      .populate('Promotions', queryPromos)
      .then(function(store){
        return store.Promotions;
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

  function getPackagesByStore(storeId){
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
    var processedDetails = details.map(function(detail){
      return getDetailTotals(detail, options);
    });
    return Promise.all(processedDetails)
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
    paymentGroup = options.paymentGroup || 1;
    var subTotal = 0;
    var total    = 0;
    var productId   = detail.Product;
    var quantity    = detail.quantity;
    var currentDate = new Date();
    
    return Product.findOne({id:productId})
      .then(function(product){
        var total;
        var mainPromo                 = getProductMainPromo(product, quantity);
        var unitPrice                 = product.Price;
        var discountKey               = getDiscountKey(options.paymentGroup);
        var discountPercent           = mainPromo ? mainPromo[discountKey] : 0;
        var discountPercentPromos     = discountPercent;
        var unitPriceWithDiscount     = calculateAfterDiscount(unitPrice, discountPercent);
        var subtotal                  = quantity * unitPrice;
        var subtotal2                 = quantity * unitPriceWithDiscount;
        var total                     = quantity * unitPriceWithDiscount;
        var discountName              = mainPromo ? getPromotionOrPackageName(mainPromo) : null;
        
        //var total                 = quantity * unitPriceWithDiscount;
        var subtotalWithPromotions    = total;
        var discount                  = total - subtotal;

        //TODO: Reactivate ewallet 
        var ewallet                   = 0;

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
          unitPrice                   : unitPrice,
          unitPriceWithDiscount       : unitPriceWithDiscount,
          immediateDelivery           : isImmediateDelivery(detail.shipDate)
        };

        if(mainPromo.id && !mainPromo.PromotionPackage){
          detailTotals.Promotion = mainPromo.id;
        }
        else if(mainPromo.PromotionPackage){
          mainPromo.discountApplied = true;
          detailTotals.PromotionPackageApplied = mainPromo.PromotionPackage;
        }

        return detailTotals;
      });
  }

  function getPromotionOrPackageName(promotionOrPackage){
    var promotionFound = _.findWhere(activePromotions, {id:promotionOrPackage.id});
    if(promotionFound){
      return promotionFound.publicName;
    }

    var packageFound = _.findWhere(storePackages, {id:promotionOrPackage.PromotionPackage});
    if(packageFound){
      return packageFound.Name;
    }

    return null;
  }

  function isImmediateDelivery(shipDate){
    var FORMAT = 'D/M/YYYY';
    var currentDate = moment().format(FORMAT);
    shipDate = moment(shipDate).format(FORMAT);
    return currentDate === shipDate;
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
  function getProductMainPromo(product, quantity){
    var packageRule = getDetailPackageRule(product.id, quantity)
    promotions = PromotionService.getProductActivePromotions(product, activePromotions);
    //Taking package rule as a promotion
    if(packageRule){
      promotions = promotions.concat([packageRule]);
    }
    return PromotionService.getPromotionWithHighestDiscount(promotions);
  }

  function isPackageDiscountApplied(){
    return _.findWhere(packagesRules, {discountApplied:true});
  }

  function getProductActivePromotions(product, activePromotions){
    activePromotions = activePromotions.filter(function(promotion){
      var isValid = false;
      if(promotion.sas){
        var productSA = product.EmpresaName || product.nameSA;
        if(promotion.sas.indexOf(productSA) > -1 ){
          isValid = true;
        } 
      }

      return isValid;
    });

    sails.log.info('activePromotions', activePromotions);

    return activePromotions;
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
    var updatedDetails = details.map(function(d){
      return updateDetail(d).then(function(updated){
        if(updated && updated.length > 0){
          return updated[0];
        }
        return null;
      });
    });
    return Promise.all(updatedDetails);
  }

  function updateDetail(detail){
    return QuotationDetail.update({id: detail.id}, detail);
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


function nativeQuotationFindOne(quotationId){
  return new Promise(function(resolve, reject){
    
    Quotation.native(function(err, collection){
      if(err){
        console.log('err finding quotation',err);
        reject(err);
      }
      var findCrieria = {_id: new ObjectId(quotationId)};
      collection.findOne(findCrieria, function(errFind, quotationFound){
        if(errFind){
          console.log('err findOne',errFind);
          reject(errFind);
        }
        resolve(quotationFound);
      });
    });

  });
}

function nativeQuotationUpdate(quotationId,params){
  return new Promise(function(resolve, reject){
    Quotation.native(function(err, collection){
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

  var props = {
    totalUntilToday: Quotation.find(queryUntilToday).sum('total'),
    totalByDateRange: Quotation.find(queryByDateRange).sum('total'),
    totalByDateRangeAll: Quotation.find(queryAllByDateRange).sum('total')
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
    countUntilToday: Quotation.count(queryUntilToday),
    countByDateRange: Quotation.count(queryByDateRange),
    countAllByDateRange: Quotation.count(queryAllByDateRange)
  })
    .then(function(result){
      return {
        untilToday: result.countUntilToday,
        byDateRange: result.countByDateRange,
        allByDateRange: result.countAllByDateRange
      };
    });
}