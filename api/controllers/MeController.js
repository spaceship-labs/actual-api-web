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
  
  activeStore: function(req, res) {
    //sails.log.info('req.activeStore', req.activeStore);
    res.json(req.activeStore);
  },
};

