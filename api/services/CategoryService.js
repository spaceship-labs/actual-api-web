var storesCodes = [];
var Promise = require('bluebird');
var _ = require('underscore');

module.exports = {
	cacheCategoriesProducts: cacheCategoriesProducts,
  buildCategoriesTree: buildCategoriesTree
};


function cacheCategoriesProducts(){
  var price = {
    '>=': 0,
    '<=': Infinity
  };
  var productsQuery = {
    Price: price,
    Active: 'Y'
  };
  sails.log.info('cache categories stock start : ' + new Date());
  return getAllStoresCodes().then(function(codes){
      storesCodes = codes;
      return ProductCategory.find({select:['Name']}).populate('Products', productsQuery);
    })
    .then(function(categories){
      return Promise.each(categories, updateCategory);
    })
    .then(function(){
      sails.log.info('cache categories stock end: ' + new Date());
      return true;
    })
    .catch(function(err){
      console.log(err);
      return err;
    })
}

function updateCategory(category){
  var categoryStock = getProductsStoresStock(category.Products);
  return ProductCategory.update({id:category.id}, categoryStock);
}

function getProductsStoresStock(products){
  var stock = {};
  stock = products.reduce(function(stockAux, product){
    for(var i = 0;i < storesCodes.length;i++){
      stockAux[storesCodes[i]] = stockAux[storesCodes[i]] || 0;
      if(product[storesCodes[i]]){
        stockAux[storesCodes[i]]++;
      }
    }
    return stockAux;
  },{});

  //Assigning 0 stock as default, when no value is provided
  for(var i=0;i<storesCodes.length; i++){
  	stock[storesCodes[i]] = stock[storesCodes[i]] || 0;
  }

  stock.productsNum = products.length;
  return stock;
}


function getAllStoresCodes(){
  return Store.find({select:['code']})
    .then(function(stores){
      var storesCodes = stores.map(function(s){
        return s.code;
      });    
      return storesCodes;
    });
}

function buildCategoriesTree(categoriesLv1, categoriesLv2, categoriesLv3){
  var categoryTree = [];
  categoriesLv1.forEach(function(clv1){
    var mainCategory = _.clone(clv1);
    mainCategory =  mainCategory.toObject();
    mainCategory.Childs = [];

    clv1.Childs.forEach(function(child){
      var lvl2 = _.findWhere( categoriesLv2, {id: child.id });
      if(lvl2){
        lvl2 = lvl2.toObject();
        mainCategory.Childs.push(lvl2);
      }
    });

    if(mainCategory.Childs.length <= 0){
      clv1.Childs.forEach(function(grandChild){
        var lvl3 = _.findWhere( categoriesLv3, {id: grandChild.id });
        if(lvl3){
          lvl3 = lvl3.toObject();
          mainCategory.Childs.push(lvl3);
        }
      });
    }

    categoryTree.push(mainCategory);
  });
  return categoryTree;  
}