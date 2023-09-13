var _ = require('underscore');

module.exports = {
  find: function(req, res) {
    Store.find()
      .then(function(stores){
        return res.json(stores);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  },

  getPromosByStore: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var currentDate = new Date();
    var queryPromo = {
      startDate: {'<=': currentDate},
      endDate: {'>=': currentDate},
    };

    if(!id || id === 'null'){
      id = SiteService.getDefaultActiveStoreId(req);
    }

    Store.findOne({id:id}).populate('Promotions', queryPromo)
      .then(function(company){
        res.json(company.Promotions);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getPackagesByCurrentStore: function(req, res){
    var form        = req.params.all();
    var id          = form.id;
    var activeStoreId = req.activeStore.id;
    var queryPromos = Search.getPromotionsQuery();
    
    Store.findOne({id:activeStoreId})
      .populate('PromotionPackages', queryPromos)
      .then(function(store){
        store.PromotionPackages.forEach((promotion) => {
          if (promotion.password) {
            delete promotion.password;
          }
        });
        res.json(store.PromotionPackages);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  getAll: function(req, res) {
    Store.find().then(function(stores) {
      return res.json(stores);
    })
    .catch(function(err){
      console.log(err);
      res.negotiate(err);
    });    
  },
  
};
