var Promise = require('bluebird');
var _ = require('underscore');

module.exports = {
  findPackages: function(req, res){
    var form = req.params.all();
    var model = 'productgroup';
    var extraParams = {
      searchFields: ['Name']
    };
    form.filters = form.filters || {};
    form.filters.Type = 'packages';
    Common.find(model, form, extraParams).then(function(result){
      res.ok(result);
    },function(err){
      console.log(err);
      res.notFound();
    });
  },

  getProducts: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductGroup.findOne({id: id, Type:'packages'}).populate('Products')
      .then(function(group){
        var products = group.Products;
        var productsIds = products.map(function(p){return p.id;});
        var q = {PromotionPackage: id, limit:1};
        return Product.find({id:productsIds}).populate('PackageRules',q);
      })
      .then(function(finalProducts){
        finalProducts = finalProducts.map(function(p){
          if(p.PackageRules.length > 0){
            p.packageRule = _.clone(p.PackageRules[0]);
          }
          delete p.PackageRules;
          return p;
        });
        res.json(finalProducts);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getDetailedPackage: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductGroup.findOne({id:id,Type:'packages'})
      .populate('Stores')
      .populate('PackageRules')
      .then(function(pack){
        return res.json(pack);
      })
      .catch(function(err){
        console.log(err);
        return res.negotiate(err);
      });
  }

};
