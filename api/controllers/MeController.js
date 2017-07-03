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
    UserWeb.update({id: user.id}, form)
      .then(function(user){
        res.json(user[0] || false);
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },

  getClient: function(req, res){
    var userId = req.user.id;
    Client.findOne({UserWeb:userId})
      .then(function(client){
        res.json(client);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });
  },

  getCurrentUser: function(req, res){
    var userId = req.user ? req.user.id : false;
    
    if(!userId){
      return res.negotiate(new Error('Usuario no encontrado'));
    }
    UserWeb.findOne({id: userId})
      .then(function(user){
        res.json(user);
      })
      .catch(function(err){
        console.log('err', err);
        res.negotiate(err);
      });
  },
  
  activeStore: function(req, res) {
    //sails.log.info('req.activeStore', req.activeStore);
    res.json(req.activeStore);
  },
};

