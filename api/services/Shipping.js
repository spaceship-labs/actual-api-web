var Promise = require('bluebird');
var _ = require('underscore');
var moment = require('moment');
var CEDIS_QROO_CODE = '01';
var CEDIS_QROO_ID = '576acfee5280c21ef87ea5b5';
var DELIVERY_AVAILABLE = 'SI';
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

var DELIVERY_AMOUNT_MODE = 'amount';
var DELIVERY_PERCENTAGE_MODE = 'percentage';

module.exports = {
  product: productShipping,
  calculateDetailDeliveryFee: calculateDetailDeliveryFee,
  isDateImmediateDelivery: isDateImmediateDelivery,
  isValidZipcode: isValidZipcode,
  DELIVERY_AVAILABLE: DELIVERY_AVAILABLE,
  DELIVERY_PERCENTAGE_MODE: DELIVERY_PERCENTAGE_MODE,
  DELIVERY_AMOUNT_MODE: DELIVERY_AMOUNT_MODE
};

function productShipping(product, storeWarehouse, options) {
  options = options || {};
  var SAMPLE_ZIPCODE = '77500';
  var pendingProductDetailsSum = 0;

  var defaultZipcodeQuery = {
    cp: SAMPLE_ZIPCODE,
    entrega: DELIVERY_AVAILABLE
  };

  var zipcodeDeliveryQuery = defaultZipcodeQuery;

  if (options.zipcodeDeliveryId) {
    zipcodeDeliveryQuery = {
      id: options.zipcodeDeliveryId,
      entrega: DELIVERY_AVAILABLE
    };
  }

  if (
    (product.Service === 'Y' || product.U_FAMILIA !== 'SI') &&
    product.ItemCode !== 'SR00078'
  ) {
    return Promise.resolve([]);
  }

  return Promise.all([
    DatesDelivery.find({
      ItemCode: product.ItemCode,
      whsCode: CEDIS_QROO_CODE,
      OpenCreQty: {
        '>': 0
      }
    }),
    ZipcodeDelivery.findOne(zipcodeDeliveryQuery),
    getPendingProductDetailsSum(product)
  ])
    .then(function(results) {
      var stockItems = results[0];
      var zipcodeDelivery = results[1];
      pendingProductDetailsSum = results[2];

      if (!zipcodeDelivery) {
        return Promise.reject(
          new Error('Envios no disponibles para ese código postal')
        );
      }

      if (
        !isDeliveryValidForActualKids(
          product,
          zipcodeDelivery,
          options.activeStore
        )
      ) {
        return Promise.reject({ type: 'empty' });
        //return [];
        //return Promise.reject( new Error("PRODUCT_NOT_AVAILABLE_IN_ZONE") );
      }

      var codes = stockItems.map(function(p) {
        return p.whsCode;
      });
      return Company.find({ WhsCode: codes }).then(function(codes) {
        stockItems = stockItems.map(function(stockItem) {
          //stockItem.company is storeWarehouse id
          stockItem.warehouseId = _.find(codes, function(ci) {
            return ci.WhsCode == stockItem.whsCode;
          }).id;
          return stockItem;
        });
        return [stockItems, zipcodeDelivery];
      });
    })
    .spread(function(stockItems, zipcodeDelivery) {
      if (stockItems.length > 0) {
        stockItems = filterStockItems(stockItems);
        var shippingPromises = stockItems.map(function(stockItem) {
          return buildShippingItem(
            stockItem,
            storeWarehouse.id,
            zipcodeDelivery,
            product,
            pendingProductDetailsSum
          );
        });

        return Promise.all(shippingPromises);
      } else if (StockService.isFreeSaleProduct(product)) {
        product.freeSaleDeliveryDays = product.freeSaleDeliveryDays || 0;
        var shipDate = moment()
          .add(product.freeSaleDeliveryDays, 'days')
          .startOf('day')
          .toDate();
        var freeSaleStockItem = {
          whsCode: CEDIS_QROO_CODE,
          OpenCreQty: product.freeSaleStock,
          ItemCode: product.ItemCode,
          warehouseId: CEDIS_QROO_ID,
          ShipDate: shipDate
        };

        return Promise.all([
          buildShippingItem(
            freeSaleStockItem,
            storeWarehouse.id,
            zipcodeDelivery,
            product,
            pendingProductDetailsSum
          )
        ]);
      }

      return new Promise(function(resolve, reject) {
        resolve([]);
      });
    })
    .then(function(result) {
      return result;
    })
    .catch(function(err) {
      if (err.type === 'empty' && !options.singleProductCalc) {
        return [];
      } else if (err.type === 'empty' && options.singleProductCalc) {
        return Promise.reject(new Error('PRODUCT_NOT_AVAILABLE_IN_ZONE'));
      }

      return Promise.reject(err);
    });
}

function isDeliveryValidForActualKids(product, zipcodeDelivery, activeStore) {
  var STATES_EXCLUDED_KIDS_PETIT_CORNIER = [
    'JALISCO',
    'QUERETARO',
    'NUEVO LEON'
  ];

  var inExcludedStates =
    STATES_EXCLUDED_KIDS_PETIT_CORNIER.indexOf(zipcodeDelivery.estado) > -1;

  if (
    product.ItmsGrpNam === 'Petit Corner' &&
    inExcludedStates &&
    activeStore.name === 'actualkids.com'
  ) {
    return false;
  }

  return true;
}

function buildShippingItem(
  stockItem,
  storeWarehouseId,
  zipcodeDelivery,
  product,
  pendingProductDetailsSum
) {
  var productDate = new Date(stockItem.ShipDate);
  var productDays = daysDiff(new Date(), productDate);
  var seasonQuery = getQueryDateRange({}, productDate);
  var zipcodeDays = getZipcodeDays(product, zipcodeDelivery);

  return Season.findOne(seasonQuery).then(function(season) {
    var LOW_SEASON_DAYS = 8; //Original: 7
    var seasonDays = (season && season.Days) || LOW_SEASON_DAYS;
    var days = productDays + zipcodeDays;
    //var days = productDays + seasonDays + zipcodeDays;
    /*
      sails.log.info('product days', productDays);
      sails.log.info('season days', seasonDays);
      sails.log.info('zipcodeDays', zipcodeDays);
      */

    var date = addDays(new Date(), days);

    return {
      available: stockItem.OpenCreQty - (pendingProductDetailsSum || 0),
      days: days,
      date: date,
      productDate: productDate,
      company: storeWarehouseId,
      companyFrom: stockItem.warehouseId,
      itemCode: stockItem.ItemCode,
      ImmediateDelivery: !_.isUndefined(stockItem.ImmediateDelivery)
        ? stockItem.ImmediateDelivery
        : false,
      PurchaseAfter: stockItem.PurchaseAfter,
      PurchaseDocument: stockItem.PurchaseDocument
    };
  });
}

function getZipcodeDays(product, zipcodeDelivery) {
  var zipcodeDays;
  if (product.deliveryType === 'softline') {
    zipcodeDays = zipcodeDelivery.dias_ent_softline;
  } else {
    zipcodeDays = zipcodeDelivery.dias_ent_bigticket;
  }

  return zipcodeDays;
}

function filterStockItems(stockItems) {
  return stockItems.filter(function(stockItem) {
    if (stockItem.ImmediateDelivery && stockItem.ItemCode !== 'SR00078') {
      return false;
    }
    return true;
  });
}

function getQueryDateRange(query, date) {
  var date = new Date(date);
  return _.assign(query, {
    StartDate: {
      '<=': date
    },
    EndDate: {
      '>=': date
    }
  });
}

function addDays(date, days) {
  date = new Date(date);
  date.setDate(date.getDate() + days);
  return date;
}

function daysDiff(a, b) {
  var _MS_PER_DAY = 1000 * 60 * 60 * 24;
  var utc1 = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var utc2 = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function isDateImmediateDelivery(shipDate) {
  var FORMAT = 'D/M/YYYY';
  var currentDate = moment().format(FORMAT);
  shipDate = moment(shipDate).format(FORMAT);
  return currentDate === shipDate;
}

function isValidZipcode(zipcode) {
  return ZipcodeDelivery.findOne({ cp: zipcode }).then(function(
    zipcodeDelivery
  ) {
    if (zipcodeDelivery) {
      return true;
    } else {
      return false;
    }
  });
}

function getPendingProductDetailsSum(product) {
  var match = {
    Product: ObjectId(product.id),
    inSapWriteProgress: true
  };

  var group = {
    _id: '$Product',
    //_id: '$quantity',
    pendingStock: { $sum: '$quantity' }
  };

  return new Promise(function(resolve, reject) {
    OrderDetailWeb.native(function(err, collection) {
      if (err) {
        console.log('err', err);
        return reject(err);
      }

      collection.aggregate([{ $match: match }, { $group: group }], function(
        _err,
        results
      ) {
        if (err) {
          console.log('_err', _err);
          return reject(_err);
        }

        //sails.log.info('results', results);
        if (results && results.length > 0) {
          return resolve(results[0].pendingStock);
        } else {
          return resolve(0);
        }
      });
    });
  });
}

function calculateDetailDeliveryFee(
  detailTotal,
  zipcodedeliveryConfig,
  quantity
) {
  var fee = 0;
  var AMOUNT_MODE = 'amount';
  var PERCENTAGE_MODE = 'percentage';

  if (detailTotal && zipcodedeliveryConfig) {
    var feeMode = zipcodedeliveryConfig.deliveryPriceMode;
    var feeValue = zipcodedeliveryConfig.deliveryPriceValue;

    if (feeMode === AMOUNT_MODE) {
      fee = feeValue * quantity;
    } else if (feeMode === PERCENTAGE_MODE) {
      fee = detailTotal * (feeValue / 100);
    }
  }

  return fee;
}
