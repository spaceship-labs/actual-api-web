/**
 * isAuthenticated
 * @description :: Policy to inject user in req via JSON Web Token
 */
var passport = require('passport');
var moment = require('moment-timezone');

module.exports = function (req, res, next) {
    passport.authenticate('jwt', function (error, user, info) {
      if (error) return res.serverError(error);
      if (!user){
        return res.unauthorized(null, info && info.code, info && info.message);
      }
      req.user = user;
      //sails.log.info('user', user);

      sails.config.timezone = getTimezone(user.activeStore);
      moment.tz.setDefault(sails.config.timezone.label);

     next();
    })(req, res);
};

function getTimezone(storeId){
  var meridaStoresIds = [
    '57bf595c89c75aed0825c3f4',
    '57bf593189c75aed0825c3f3'
  ];
  
  var timezone = {
    label:'America/Cancun', 
    offset:-6
  };
  
  if(meridaStoresIds.indexOf(storeId) > -1){
    timezone = {
      label:'America/Merida',
      offset:-6
    };
  }
  return timezone;
}