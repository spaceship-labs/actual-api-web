var _ = require('underscore');

module.exports = function (req, res, next) {
  var user       = req.user.id;
  var controller = req.options.controller;
  var action     = req.options.action;
  Permission.find({
    action: action,
    controller: controller
  })
    .populate('owners')
    .then(function(permissions) {
      var allowed = _.find(permissions || [], function(permission){
        var owners = permission.owners.map(function(owner){
          return owner.id;
        });
        return owners.indexOf(user) !== -1;
      });
      if (!allowed) {
        return res.unauthorized('user is not authorized');
      } else {
        return next();
      }
    })
    .catch(function(err){
      console.log(err);
      res.negotiate(err);
    });
};
