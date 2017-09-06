module.exports = {
  findByHandle: function(req, res){
    var form = req.params.all();
    var handle = form.handle;
    Site.findOne({handle:handle})
      .then(function(site){
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
        res.json(site);
      }).catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },


};
