/**
 * MeController
 *
 * @description :: Server-side logic for managing us
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var Promise = require('bluebird');

module.exports = {
  update: function(req, res) {
    var form = req.params.all();
    var user = req.user;
    delete form.password;
    delete form.email;
    User.update({id: user.id}, form)
      .then(function(user){
        res.json(user[0] || false);
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },
  
  activeStore: function(req, res) {
    var user = req.user;
    var storeQuery = Store.findOne({
      id: SiteService.getDefaultActiveStoreId(req)
    });
    
    if(user){
      User.findOne(user.id).populate('activeStore');
    }

      storeQuery.then(function(result){
        var store;
        if(user && result){
          store = user.activeStore;
        }
        else if(result && !user){
          store = result;
        }

        if(store){
          res.json(store);
        }
        else{
          return Promise.reject(new Error('Store not found'));
        }

      })
      .catch(function(err){
        console.log('err')
        res.negotiate(err);
      });
  },

  generateCashReport: function(req, res){
    var form = req.params.all();
    var user = req.user;
    var startDate = form.startDate || new Date();
    var endDate = form.endDate || new Date();
    var q = {
      User: user.id,
      createdAt: { '>=': startDate, '<=': endDate }
    };
    Payment.find(q).populate('Order').populate('Store')
      .then(function(payments){
        res.json(payments);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  }
};

