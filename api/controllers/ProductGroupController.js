var _ = require('underscore');

module.exports = {

  find: function(req, res){
    var form = req.params.all();
    var model = 'productgroup';
    var extraParams = {
      searchFields: ['Name']
    };
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      })
  },

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductGroup.findOne({id:id})
      .populate('Products')
      .then(function(group){
        res.json(group);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      })
  },

  getVariantGroupProducts: function(req, res){
    var form = req.params.all();
    var id = form.id;
    ProductGroup.findOne({id:id, Type:'variations'}).populate('Products')
      .then(function(group){
        if(group.Products.length > 0){
          var productsIds = [];
          group.Products.forEach(function(prod){
            productsIds.push(prod.ItemCode);
          });
          return Product.find({ItemCode: productsIds}).populate('FilterValues')
        }else{
          return false;
        }
      })
      .then(function(products){
        if(products){
          return res.json(products);
        }
        return res.json(false);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  search: function(req, res){
    var form = req.params.all();
    var model          = 'productgroup';
    var extraParams = {
      searchFields: [
        'Name'
      ]
    };
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


  findPackages: function(req, res){
    var form = req.params.all();
    var model = 'productgroup';
    var extraParams = {
      searchFields: ['Name']
    };
    form.filters = form.filters || {};
    form.filters.Type = 'packages';
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

};
