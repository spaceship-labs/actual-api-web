var storesCodes = [];
var Promise = require('bluebird');
var _ = require('underscore');

module.exports = {
  buildCategoriesTree: buildCategoriesTree
};

async function buildCategoriesTree(categoriesLv1, categoriesLv2, categoriesLv3) {
  var categoryTree = [];
  const promises = await categoriesLv1.map(async ({ id }) => {
    const { FeaturedProducts } = await ProductCategory.findOne({ id }).populate('FeaturedProducts');
    return { id, featuredProducts: FeaturedProducts.length > 0 ? FeaturedProducts : [] };
  });
  const categoriesWithFeaturedProducts = await Promise.all(promises);
  categoriesLv1.forEach(async clv1 => {
    var mainCategory = _.clone(clv1);
    mainCategory = mainCategory.toObject();
    mainCategory.Childs = [];
    const { featuredProducts } = _.findWhere(categoriesWithFeaturedProducts, { id: clv1.id });
    mainCategory.featuredProducts = featuredProducts;
    clv1.Childs.forEach(child => {
      var lvl2 = _.findWhere(categoriesLv2, { id: child.id });
      if (lvl2) {
        lvl2 = lvl2.toObject();
        mainCategory.Childs.push(lvl2);
      }
    });

    if (mainCategory.Childs.length <= 0) {
      clv1.Childs.forEach(grandChild => {
        var lvl3 = _.findWhere(categoriesLv3, { id: grandChild.id });
        if (lvl3) {
          lvl3 = lvl3.toObject();
          mainCategory.Childs.push(lvl3);
        }
      });
    }
    categoryTree.push(mainCategory);
  });

  return categoryTree;
}
