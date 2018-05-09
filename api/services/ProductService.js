var Promise = require('bluebird');
var _ = require('underscore');
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

module.exports = {
  mapProductsMainPromo: mapProductsMainPromo,
  cacheProductDiscountPrices: cacheProductDiscountPrices,
  getMostDemandedOnWeb
};

function mapProductsMainPromo(products) {
  return products.map(assignProductMainPromo);
}

function assignProductMainPromo(product, storePromotions) {
  if (product.Promotions && product.Promotions.length > 0) {
    var indexMaxPromo = 0;
    var maxPromo = 0;

    if (storePromotions) {
      //Intersection product promotions and storePromotions
      product.Promotions = product.Promotions.filter(function(promotion) {
        return _.findWhere(storePromotions, { id: promotion.id });
      });
    }

    for (var i = 0; i < product.Promotions.length; i++) {
      if (product.Promotions[i].discountPg1 >= maxPromo) {
        maxPromo = product.Promotions[i].discountPg1;
        indexMaxPromo = i;
      }
    }
    product.mainPromo = product.Promotions[indexMaxPromo];
  }

  return product;
}

function cacheProductDiscountPrices() {
  console.log('Start cacheProductDiscountPrices ' + new Date());
  var promotionsQuery = Search.getPromotionsQuery();
  var stores = [];
  var updateCounter;

  Store.find({})
    .populate('Promotions', promotionsQuery)
    .then(function(storesResult) {
      stores = storesResult;
      console.log('stores ' + new Date(), stores.length);
      var findCrieria = {
        Active: 'Y',
        Available: { '>': 0 }
      };
      return Product.find(findCrieria).populate('Promotions', promotionsQuery);
    })
    .then(function(products) {
      console.log('products ' + new Date(), products.length);
      return Promise.map(products, function(product) {
        return relateProductPromotionsWithStoresPromotions(product, stores);
      });
    })
    .then(function(mappedProducts) {
      //console.log('mappedProducts ' + new Date(), mappedProducts.length);
      return updateMappedProducts(mappedProducts);
    })
    .then(function(updatedProducts) {
      console.log('updatedProducts cache prices' + new Date(), updatedProducts.length);
      //console.log('finish updateMappedProducts ' + new Date());
    })
    .catch(function(err) {
      console.log('err on cacheProductDiscountPrices', err);
    });
}

function updateMappedProducts(mappedProducts) {
  return Promise.each(mappedProducts, function(p) {
    //console.log('updating product: ', p);
    return nativeProductUpdate(p);
  });
}

function nativeProductUpdate(product) {
  return new Promise(function(resolve, reject) {
    Product.native(function(err, collection) {
      if (err) {
        console.log('err updating product', err);
        reject(err);
      }
      var findCrieria = { _id: new ObjectId(product.id) };
      var updateParams = {
        $set: _.omit(product, ['id'])
      };
      collection.updateOne(findCrieria, updateParams, function(errUpdate, result) {
        if (errUpdate) {
          console.log('errUpdate updating product', errUpdate);
          reject(errUpdate);
        }
        resolve(result);
      });
    });
  });
}

function relateProductPromotionsWithStoresPromotions(product, stores) {
  return Promise.map(stores, function(store) {
    return getProductDiscountPriceByStore(product, store);
  }).then(function(productDiscountPrices) {
    var productObj = productDiscountPrices.reduce(
      function(hash, price) {
        hash[price.discountPriceKey] = price.value || product.Price;
        return hash;
      },
      { id: product.id }
    );

    return productObj;
  });
}

function getProductDiscountPriceByStore(product, store) {
  var discountPriceKey = 'discountPrice_' + store.code;
  product = assignProductMainPromo(product, Store.Promotions);

  if (product.mainPromo) {
    var maxDiscount = product.mainPromo.discountPg1;
    product.maxDiscount = maxDiscount;
    product[discountPriceKey] = product.Price - product.Price / 100 * maxDiscount;
  } else {
    product[discountPriceKey] = product.Price;
  }

  var discountPrice = {
    discountPriceKey: discountPriceKey,
    value: product[discountPriceKey]
  };

  return discountPrice;
}

function getMostDemandedOnWeb(storeCode) {
  var group = {
    _id: '$Product',
    demandedCount: { $sum: 1 }
  };
  console.log('start cache demanded products', new Date());

  var storeId;
  var quotationsIds = [];
  return Store.findOne({ code: storeCode })
    .populate('Quotations')
    .then(function(store) {
      storeId = store.id;
      quotationsIds = store.Quotations.map(function(q) {
        return new ObjectId(q.id);
      });
      console.log('quotationsIds', quotationsIds);
      //console.log('storeId', storeId);
      return new Promise(function(resolve, reject) {
        QuotationDetailWeb.native(function(err, collection) {
          if (err) {
            console.log('err', err);
            return reject(err);
          }
          collection.aggregate(
            [
              { $match: { QuotationWeb: { $in: quotationsIds } } },
              { $group: group },
              { $sort: { demandedCount: -1 } }
            ],
            function(_err, results) {
              if (err) {
                console.log('_err', _err);
                return reject(_err);
              }
              console.log('results', results);
              return Promise.map(results, function(productReport) {
                return getProductItemCode(productReport._id, productReport.demandedCount);
              }).then(function(itemCodes) {
                console.log('end cache demanded products', new Date());
                resolve(itemCodes);
              });
            }
          );
        });
      });
    });
}

function getProductItemCode(productId, demandedCount) {
  var findCrieria = { _id: new ObjectId(productId) };
  return Common.nativeFindOne(findCrieria, Product).then(function(product) {
    return { ItemCode: product.ItemCode, demandedCount };
  });
}
