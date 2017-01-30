var assign   = require('object-assign');
var _        = require('underscore');
var Promise  = require('bluebird');

module.exports = {
  applyFilters            : applyFilters,
  applyOrFilters          : applyOrFilters,
  areFiltersApplied       : areFiltersApplied,
  getMultiIntersection    : getMultiIntersection,
  getProductsByCategories : getProductsByCategories,
  getProductsByCategory   : getProductsByCategory,
  getProductsByFilterValue: getProductsByFilterValue,
  getProductsByGroup      : getProductsByGroup,
  getPromotionsQuery      : getPromotionsQuery,
  hashToArray             : hashToArray,
  promotionCronJobSearch  : promotionCronJobSearch,
  queryIdsProducts        : queryIdsProducts,
  getPriceQuery           : getPriceQuery,
  queryTerms              : queryTerms,
  populateProductsIdsToPromotions: populateProductsIdsToPromotions,
  relatePromotionsToProducts: relatePromotionsToProducts,
  getDiscountPriceKeyByStoreCode: getDiscountPriceKeyByStoreCode  
};

//Promotions array of promotion object with property productsIds
function relatePromotionsToProducts(promotions, products){
  for(var i = 0; i<products.length;i++){
    for(var j=0; j<promotions.length; j++){

      products[i].Promotions = products[i].Promotions || [];

      var validPromotion = promotions[j].productsIds.indexOf(products[i].id); 
      if(validPromotion >= 0){
        products[i].Promotions = products[i].Promotions.concat( promotions[j] );
      }

    }
  }

  return products;
}

function populateProductsIdsToPromotions(promotions){
  return Promise.each(promotions, populateProductsIdsToPromotion);
}

function populateProductsIdsToPromotion(promotion){
  return Product_Promotion.find({promotion: promotion.id})
    .then(function(productPromotionRelations){
      var productsIds = productPromotionRelations.map(function(pp){
        return pp.product;
      });
      promotion.productsIds = productsIds;
      return promotion.productsIds;
    });
}

function queryIdsProducts(query, idProducts) {
  return assign(query, {
    id: idProducts
  });
}

function getPriceQuery(query, priceField, minPrice, maxPrice) {
  var priceQuery = {
    '>=': minPrice || 0,
    '<=': maxPrice || Infinity
  };
  var queryExtension = {};
  queryExtension[priceField] = priceQuery;
  return assign(query, queryExtension);
}

function applyFilters(query, filters) {
  if( _.isArray(filters) && filters.length > 0 ){
    filters.forEach(function(filter) {
      if (filter.value && !_.isUndefined(filter.value) && _.isArray(filter.value) && filter.value.length > 0) {
        query[filter.key] = filter.value;
      } else if (filter.value && !_.isUndefined(filter.value) && !_.isArray(filter.value)) {
        query[filter.key] = filter.value;
      }
    });
  }
  return query;
}

function applyOrFilters(query, filters){
  if( _.isArray(filters) && filters.length > 0 ){
    var andConditions = [];
    filters.forEach(function(filter){
      if( isFilterValid(filter) ){
        var orConditions = [];
        filter.values.forEach(function(val){
          var condition = {};
          condition[filter.key] = val;
          orConditions.push(condition);
        });
        if(orConditions.length > 0){
          andConditions.push({$or: orConditions});
        }
      }
    });
    if(andConditions.length > 0){
      query.$and = andConditions;
    }
  }
  return query;
}

function isFilterValid(filter){
  filter.values = filter.values.filter(function(v){
    return !_.isUndefined(v);
  });
  if(filter.values && filter.values.length > 0){
    return true;
  }
  return false;
}

function queryTerms(query, terms) {
  if (!terms || terms.length == 0) {
    return query;
  }
  var searchFields = [
    'Name',
    'ItemName',
    'ItemCode',
    'Description',
    'DetailedColor'
  ];
  var filter = searchFields.reduce(function(acum, sf){
    var and = terms.reduce(function(acum, term){
      var fname = {};
      fname[sf] = {contains: term};
      return acum.concat(fname);
    }, []);
    return acum.concat({$and: and});
  }, []);

  return assign(query, {$or: filter});
}

function getProductsByCategory(categoryQuery) {
  return ProductCategory.find(categoryQuery)
    .then(function(category) {
      category = category.map(function(cat){return cat.id;});
      return Product_ProductCategory.find({productCategory: category});
    })
    .then(function(relations) {
      return relations.map(function(relation){
        return relation.product;
      });
    });
}

function getProductsByCategories(categoriesIds, options) {
  var productsIds         = [];
  var relationsHash       = {};
  var relationsArray      = [];
  options = options || {};
  return Product_ProductCategory.find({productCategory: categoriesIds})
    .then(function(relations) {
      relationsHash   = getProductRelationsHash(relations, 'product', 'productCategory');
      relationsArray  = hashToArray(relationsHash);
      if(options.applyIntersection){
        //If product has all the searching categories        
        relationsArray = getRelationsWithCategories(relationsArray, categoriesIds);
      }
      productsIds = relationsArray.map(function(relation) {
        return relation[0]; //Product ID
      });

      return productsIds;
    });
}

function getProductsByFilterValue(filtervaluesIds){
  var relationsHash       = {};
  var relationsArray      = [];  
  return Product_ProductFilterValue.find({productfiltervalue: filtervaluesIds})
    .then(function(relations) {
      relationsHash   = getProductRelationsHash(relations, 'product', 'productfiltervalue');
      relationsArray  = hashToArray(relationsHash);
       //Check if product has all the filter values
      relationsArray  = getRelationsWithFilterValues(relationsArray, filtervaluesIds);
      return relationsArray.map(function(relation) {
        return relation[0]; //Product ID
      });
    });
}

function getProductsByGroup(groups) {
  return ProductGroup.find({id:groups})
    .then(function(group) {
      group = group.map(function(grp){return grp.id;});
      return Product_ProductGroup.find({productgroup: group});
    })
    .then(function(relations) {
      return relations.map(function(relation){
        return relation.product;
      });
    });
}


function hashToArray(hash) {
  var entries = Object.keys(hash);
  return entries.map(function(entry){
    return [entry, hash[entry]]
  });
}

//Advanced search for marketing cron job
function promotionCronJobSearch(opts) {
  var categories          = [].concat(opts.categories);
  var filtervalues        = [].concat(opts.filtervalues);
  var groups              = [].concat(opts.groups);
  var sas                 = [].concat(opts.sas);
  var excluded            = opts.excluded || [];
  var excludedCategories  = opts.excludedCategories || [];
  var price               = {
    '>=': opts.minPrice || 0,
    '<=': opts.maxPrice || Infinity
  };
  var query               = {};
  var products            = [];
  var filters = [
    {key:'Price', value: price},
    {key:'Active', value: 'Y'},
    {key:'OnStudio', value: opts.OnStudio},
    {key:'OnHome', value: opts.OnHome},
    {key:'OnKids', value: opts.OnKids},
    {key:'OnAmueble', value: opts.OnAmueble},
    {key:'ItemCode', value: opts.itemCode}
  ];
  var orFilters = [
    {key: 'CustomBrand', values: [].concat(opts.customBrands)},
    {key: 'U_Empresa', values: sas},
  ];

  return getProductsByCategories(
    categories, 
    {excludedCategories: opts.excludedCategories}
  )
    .then(function(catprods) {
      return [
        catprods,
        getProductsByFilterValue(filtervalues),
        getProductsByGroup(groups)
      ];
    })
    .spread(function(catprods, filterprods, groupsprods) {
      return getMultiIntersection([catprods, filterprods, groupsprods]);
    })
    .then(function(idProducts) {
      if( areFiltersApplied(categories, filtervalues, groups) && idProducts.length > 0){
        if(excluded.length > 0){
          var ids = _.difference(idProducts, excluded);
          filters.push({key:'id',value:ids});
        }else{
          filters.push({key:'id', value: idProducts});
        }
      }else if( areFiltersApplied(categories, filtervalues, groups) && idProducts.length == 0){
        return [];
      }

      if(excluded.length > 0 && idProducts.length == 0){
        filters.push({
          key:'id',
          value:{'!':excluded}
        });
      }
      query    = applyFilters({},filters)
      query    = applyOrFilters(query , applyOrFilters);

      var freeSaleQuery = _.clone(query);
      freeSaleQuery = _.extend(freeSaleQuery, {
        freeSale: true,
        freeSaleStock: {'>':0}
      });

      var searchQuery = {
        $or: [
          query,
          freeSaleQuery
        ]
      };

      products = Product.find(searchQuery);
      return products;
    })
    .then(function(products) {
      return products;
    })
    .catch(function(err) {
      console.log(err);
      return err;
    });
}

function getPromotionsQuery(){
  var currentDate = new Date();
  var query = {
    //select: ['discountPg1','discountPg2','discountPg3','discountPg4','discountPg5'],
    startDate: {'<=': currentDate},
    endDate: {'>=': currentDate},
  };
  return query;
}


//@param: relations: array of objects
function getProductRelationsHash(relations, productKey, relateToKey){
  var relationsHash = relations.reduce(function(productMap, relation){
    var productId  = relation[productKey];
    var relateToId = relation[relateToKey];
    productMap[productId] = (productMap[productId] || []).concat(relateToId);
    return productMap;
  }, {});  
  return relationsHash;
}

function areFiltersApplied(categories, filtervalues, groups){
  return (categories.length > 0 || filtervalues.length > 0 || groups.length > 0);  
}

/*
* @param Array of arrays, eg: 
* [ 
*   [ productId , [<categoryId/filterValuesIds>, <categoryId/filterValuesIds>, <categoryId/filterValuesIds>] ],
*   [ productId , [<categoryId/filterValuesIds>, <categoryId/filterValuesIds>, <categoryId/filterValuesIds>] ]
* ]
*/
function getRelationsWithCategories(relations, categoriesIds){
  var filteredRelations = relations.filter(function(relation) {
    var productCategories = relation[1];
    return _.isEqual(categoriesIds, productCategories);
  });
  return filteredRelations;
}

function getRelationsWithFilterValues(relations, filterValuesIds){
  var filteredRelations = relations.filter(function(relation) {
    var productFilterValues = relation[1];
    return _.isEqual(filterValuesIds, productFilterValues);
  });
  return filteredRelations;
}


function getMultiIntersection(arrays, options){
  options = options || {ignoreEmptyArrays:true};
  if(options.ignoreEmptyArrays){
    arrays = arrays.filter(function(arr){return arr.length > 0});
  }
  return _.intersection.apply(null, arrays);
}

function getDiscountPriceKeyByStoreCode(storeCode){
  return 'discountPrice_' + storeCode;
}