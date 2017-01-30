var Promise = require('bluebird');

module.exports = {
  update: function(req, res){
    var form = req.params.all();
    var handle = form.handle;
    Site.update({handle:handle}, form).then(function(updated){
      res.json(updated);
    }).catch(function(err){
      console.log(err);
      res.negotiate(err);
    });
  },

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

  getAll: function(req, res){
    var form = req.params.all();
    Site.find({}).then(function(sites){
      res.json(sites);
    })
    .catch(function(err){
      console.log('err',err);
      res.negotiate(err);
    });
  }
};
