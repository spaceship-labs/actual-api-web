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

  getPackagesByStore: function(req, res){
    var form        = req.params.all();
    var id          = form.id;
    var queryPromos = Search.getPromotionsQuery();
    Store.findOne({id:id})
      .populate('PromotionPackages', queryPromos)
      .then(function(store){
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
