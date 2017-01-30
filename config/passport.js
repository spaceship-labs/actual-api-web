var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

var EXPIRES_IN = 60*24*60; //seconds
var SECRET = process.env.tokenSecret || "4ukI0uIVnB3iI1yxj646fVXSE3ZVk4doZgz6fTbNg7jO41EAtl20J5F7Trtwe7OM";
var ALGORITHM = "HS256";
var ISSUER = "actual.com";
var AUDIENCE = "actual.com";

var LOCAL_STRATEGY_CONFIG = {
  usernameField: 'email',
  passwordField: 'password',
  passReqToCallback: false
};

var JWT_STRATEGY_CONFIG = {
  jwtFromRequest: ExtractJwt.fromAuthHeader(),
  secretOrKey: SECRET,
  issuer: ISSUER,
  audience: AUDIENCE
};

function _onLocalStrategyAuth(email, password, next){
  User.findOne({email: email})
    .populate('role')
    .populate('Seller')
    .exec(function(error, user){
      if (error) return next(error, false, {});
      if (!user) return next(null, false,{
        code: 'INCORRECT_AUTHDATA',
        message:'Incorrect auth data'
      });

      if(!user.active){
        return next(null, false, {
          code: 'USER_NOT_ACTIVE',          
          message: 'USER NOT ACTIVE'
        });        
      }        

      //TODO: replace with new cipher service type
      if( !CipherService.comparePassword(password, user) ){
        return next(null, false, {
          code: 'INCORRECT_AUTHDATA',
          message:'Incorrect auth data'        
        });
      }

      User.update({id : user.id},{ lastLogin : new Date() })
        .exec(function(err,ruser){
          if (error) return next(error, false, {});

          delete user.password;
          return next(null, user, {});
        });

  });
}

//Triggers when user authenticates via JWT strategy

function _onJwtStrategyAuth(payload, next){
  var payloadUser = payload.user || {};
  var userId = payloadUser.id || false;
  if(!userId){
    return next(null, false, {
      code: 'USER_ID_UNDEFINED',
      message: 'USER ID UNDEFINED'
    });
  }

  return User.findOne({id: userId})
    .populate('activeStore')
    .populate('role')
    .populate('Seller')
    //.populate('Stores')
    .then(function(userFound){
      var user = userFound;

      if(!user.active){
        return next(null, false, {
          code: 'USER_NOT_ACTIVE',
          message: 'USER NOT ACTIVE'
        });        
      }

      return next(null, user, {});
    })
    .catch(function(err){
      console.log('err', err);
      return next(err, false, {
        message: 'USER NOT FOUND'
      });
    });
  

}

passport.use(
  new LocalStrategy(LOCAL_STRATEGY_CONFIG, _onLocalStrategyAuth)
);

passport.use(
  new JwtStrategy(JWT_STRATEGY_CONFIG, _onJwtStrategyAuth)
);

module.exports = {
  jwtSettings: {
    expiresIn: EXPIRES_IN,
    secret: SECRET,
    algorithm: ALGORITHM,
    issuer: ISSUER,
    audience: AUDIENCE
  },
  express:{
    customMiddleware: function(app){
      var timeout = require('connect-timeout');
      var timeoutSeconds = 36000;
      var express = require('express');
      app.use(express.compress());      
      app.use(timeout(timeoutSeconds+'s'));
      app.use(Files.middleware);
    }
  }
};
