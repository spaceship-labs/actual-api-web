var storesCodes = [];
var Promise = require('bluebird');
var _ = require('underscore');

module.exports = {
  buildCategoriesTree: buildCategoriesTree
};


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