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

  create: function(req, res){
    var form = req.params.all();
    ProductGroup.create(form)
      .then(function(created){
        res.json(created);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  update: function(req,res){
    var form = req.params.all();
    delete form.Products;
    ProductGroup.update({id: form.id}, form)
      .then(function(updated){
        res.json(updated);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  destroy: function(req, res){
    var form = req.params.all();
    ProductGroup.destroy({id: form.id})
      .then(function(){
        res.json({destroyed:true});
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  addProductToGroup: function(req, res){
    var form = req.params.all();
    var product = form.product;
    var group = form.group;

    Product_ProductGroup.create({product:product, productgroup:group})
      .then(function(created){
        res.json(created);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  removeProductFromGroup: function(req, res){
    var form = req.params.all();
    var product = form.product;
    var group = form.group;

    Product_ProductGroup.destroy({product:product, productgroup:group})
      .then(function(){
        res.json({destroyed:true});
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

  updateIcon: function(req,res){
    var form = req.params.all();
    var options = {
      dir : 'groups',
      profile: 'avatar',
      id : form.id,
    };

    ProductGroup.updateAvatar(req,options)
      .then(function(productGroup){
        res.json(productGroup);
      })
      .catch(function(err){
        console.log('updateIcon err', err);
        res.negotiate(err);
      });      

  },

  removeIcon: function(req,res){
    process.setMaxListeners(0);
    var form = req.params.all();
    var options = {
      dir : 'groups',
      profile: 'avatar',
      id : form.id,
    };

    ProductGroup.destroyAvatar(req,options)
      .then(function(result){
        res.json(result);
      })
      .catch(function(err){
        console.log('err removeIcon', err);
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
