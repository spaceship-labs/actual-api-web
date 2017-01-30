module.exports = {
  syncProducts: function(req, res){
    sails.log.info('sync');
    SyncService.syncProducts().then(function(response){
      res.json(response);
    }).catch(function(err){
      res.negotiate(err);
    });
  },

  fixOrders: function(req, res){
  	Common.reassignOrdersDates();
  }
};

