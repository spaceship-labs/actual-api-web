/**
 * PermissionController
 *
 * @description :: Server-side logic for managing permissions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  find: function(req, res) {
    Permission.find()
	    .then(function(permissions) {
	      return res.json(permissions);
	    })
	    .catch(function(err){
	      console.log(err);
	      res.negotiate(err);
	    });
  }
};

