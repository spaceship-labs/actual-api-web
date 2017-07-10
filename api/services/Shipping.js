var Promise = require('bluebird');
var _       = require('underscore');
var moment = require('moment');
var CEDIS_QROO_CODE = '01';
var CEDISQ_QROO_ID = '576acfee5280c21ef87ea5b5';
var DELIVERY_AVAILABLE = 'SI';
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

module.exports = {
  product: productShipping,
  isDateImmediateDelivery: isDateImmediateDelivery,
  isValidZipcode: isValidZipcode
};

function productShipping(product, storeWarehouse, options) {
  options = options || {};
  var SAMPLE_ZIPCODE = "01000";
  var pendingProductDetailsSum = 0;

  var defaultZipcodeQuery = {
    cp: SAMPLE_ZIPCODE,
  };

  var zipcodeDeliveryQuery = defaultZipcodeQuery;

  if(options.zipcodeDeliveryId){
    zipcodeDeliveryQuery = {id: options.zipcodeDeliveryId};
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

      if(!zipcodeDelivery){
        return Promise.reject(new Error("Envios no disponibles para ese código postal"));
      }

      var codes = stockItems.map(function(p){return p.whsCode;});
      return Company
        .find({WhsCode: codes})
        .then(function(codes) {
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
    .spread(function(stockItems, zipcodeDelivery){
      if( stockItems.length > 0){

        stockItems = filterStockItems(stockItems);
        var shippingPromises = stockItems.map(function(stockItem){
          return buildShippingItem(
            stockItem, 
            storeWarehouse.id, 
            zipcodeDelivery,
            product,
            pendingProductDetailsSum
          );
        });

        return Promise.all(shippingPromises);
      }
      else if( StockService.isFreeSaleProduct(product) ){
        product.freeSaleDeliveryDays = product.freeSaleDeliveryDays || 0;
        var shipDate = moment().add(product.freeSaleDeliveryDays,'days').startOf('day').toDate();
        var freeSaleStockItem = {
          whsCode: CEDIS_QROO_CODE,
          OpenCreQty: product.freeSaleStock,
          ItemCode: product.ItemCode,
          warehouseId: CEDISQ_QROO_ID,
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

      return new Promise(function(resolve, reject){
        resolve([]);
      });
    })
    .then(function(result){
      return result;
    });

}

function buildShippingItem(stockItem, storeWarehouseId, zipcodeDelivery, product, pendingProductDetailsSum){

  var productDate  = new Date(stockItem.ShipDate);
  var productDays  = daysDiff(new Date(), productDate);
  var seasonQuery  = getQueryDateRange({}, productDate);
  var zipcodeDays  = getZipcodeDays(product, zipcodeDelivery);

  return Season.findOne(seasonQuery)
    .then(function(season){
      var seasonDays   = (season && season.Days) || 7;
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
        ImmediateDelivery: !_.isUndefined(stockItem.ImmediateDelivery) ? stockItem.ImmediateDelivery : false        
      };      
    });
}

function getZipcodeDays(product, zipcodeDelivery){
  var zipcodeDays;
  if(product.deliveryType === 'softline'){
    zipcodeDays = zipcodeDelivery.dias_ent_softline;
  }else{
    zipcodeDays = zipcodeDelivery.dias_ent_bigticket;
  }

  return zipcodeDays;
}

function filterStockItems(stockItems){

  return stockItems.filter(function(stockItem){
    
    if(stockItem.ImmediateDelivery){
      return false;
    }
    return true;
  });
}


function getImmediateStockItem(stockItems, deliveries){

  return _.find(stockItems, function(stockItem){
  
    var delivery = _.find(deliveries, function(delivery) {
      return delivery.FromCode == stockItem.whsCode;
    });

    return stockItem.whsCode === delivery.ToCode; //&& stockItem.ImmediateDelivery;
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
  var utc1        = Date.UTC(a.getFullYear(), a.getMonth(), a.getDate());
  var utc2        = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

function isDateImmediateDelivery(shipDate){
  var FORMAT = 'D/M/YYYY';
  var currentDate = moment().format(FORMAT);
  shipDate = moment(shipDate).format(FORMAT);
  return currentDate === shipDate;
}

function isValidZipcode(zipcode){
  return ZipcodeDelivery.findOne({cp: zipcode})
    .then(function(zipcodeDelivery){
      if(zipcodeDelivery){
        return true;
      }else{
        return false;
      }
    });
}

function getPendingProductDetailsSum(product){
  
  var match = {
    Product: ObjectId(product.id),
    inSapWriteProgress: true
  };

  var group = {
    _id: '$Product',
    //_id: '$quantity',
    pendingStock: {$sum:'$quantity'}
  };

  return new Promise(function(resolve, reject){
    OrderDetailWeb.native(function(err, collection){
      if(err){
        console.log('err', err);
        return reject(err);
      }
      
      collection.aggregate([
        {$match: match},
        {$group:group}
      ],
        function(_err,results){
          if(err){
            console.log('_err', _err);
            return reject(_err);
          }

          //sails.log.info('results', results);
          if(results && results.length > 0){
            return resolve(results[0].pendingStock);
          }else{
            return resolve(0);
          }
        }
      );
    });
  });  
}