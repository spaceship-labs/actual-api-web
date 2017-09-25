module.exports = {
  findByHandle: function(req, res){
    var form = req.params.all();
    var handle = form.handle;
    var findPromise = Site.findOne({handle:handle})
    
    if(form.getBanners){
      findPromise.populate('Banners');
    }

    findPromise.then(function(site){
        res.json(site);
      }).catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  findBannersByHandle: function(req, res){
    var form = req.params.all();
    var handle = form.handle;
    Site.findOne({handle:handle}).populate('Banners')
      .then(function(site){
        if(!site){
          return res.json([]);
        }
        res.json(site.Banners);
      }).catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


};
