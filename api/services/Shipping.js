var Promise = require('bluebird');
var _       = require('underscore');
var moment = require('moment');
var CEDIS_QROO_CODE = '01';
var CEDISQ_QROO_ID = '576acfee5280c21ef87ea5b5';

module.exports = {
  product: productShipping
};

function productShipping(product, storeWarehouse, options) {
  return Delivery.find({ToCode: storeWarehouse.WhsCode, Active:'Y'})
    .then(function(deliveries) {
      var companies = deliveries.map(function(delivery) {
        return delivery.FromCode;
      });
      return [
        DatesDelivery.find({
          ItemCode: product.ItemCode,
          whsCode: companies,
          OpenCreQty: {
            '>': 0
          }
        }),
        deliveries,
      ];
    })
    .spread(function(stockItems, deliveries) {
      var codes = stockItems.map(function(p){return p.whsCode});
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
          return [stockItems, deliveries];
        });
    })
    .spread(function(stockItems, deliveries){
      if(deliveries.length > 0 && stockItems.length > 0){

        stockItems = filterStockItems(stockItems, deliveries);
        var shippingPromises = stockItems.map(function(stockItem){
          return buildShippingItem(
            stockItem, 
            deliveries, 
            storeWarehouse.id
          );
        });

        return Promise.all(shippingPromises);
      }
      else if( StockService.isFreeSaleProduct(product) && deliveries){
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
          buildShippingItem(freeSaleStockItem, deliveries, storeWarehouse.id)
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

function buildShippingItem(stockItem, deliveries, storeWarehouseId, options){
  options = options || {};

  var delivery = _.find(deliveries, function(delivery) {
    return delivery.FromCode == stockItem.whsCode;
  });

  var productDate  = new Date(stockItem.ShipDate);
  var productDays  = daysDiff(new Date(), productDate);
  var seasonQuery  = getQueryDateRange({}, productDate);

  return Season.findOne(seasonQuery)
    .then(function(season){
      var seasonDays   = (season && season.Days) || 7;
      var deliveryDays = (delivery && delivery.Days) || 0;
      var days = productDays + seasonDays + deliveryDays;
      
      //Product in same store/warehouse
      if(stockItem.whsCode === delivery.ToCode && stockItem.ImmediateDelivery){
        days = productDays;
      }
      
      var date = addDays(new Date(), days);

      return {
        available: stockItem.OpenCreQty,
        days: days,
        date: date,
        productDate: productDate,
        company: storeWarehouseId,
        companyFrom: stockItem.warehouseId,
        itemCode: stockItem.ItemCode
      };      
    });
}

function filterStockItems(stockItems, deliveries){

  return stockItems.filter(function(stockItem){
  
    var delivery = _.find(deliveries, function(delivery) {
      return delivery.FromCode == stockItem.whsCode;
    });

    //Only use immediate delivery stock items, when from and to warehouses
    //are the same
    if(stockItem.ImmediateDelivery){
      return stockItem.whsCode === delivery.ToCode;
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

