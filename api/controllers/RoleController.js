/**
 * RoleController
 *
 * @description :: Server-side logic for managing Roles
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  find: function(req, res) {
    Role.find().then(function(roles) {
      return res.json(roles);
    })
    .catch(function(err){
    	console.log(err);
    	res.negotiate(err);
    });
  }
};

