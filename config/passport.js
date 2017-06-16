var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var JwtStrategy = require('passport-jwt').Strategy;
var ExtractJwt = require('passport-jwt').ExtractJwt;

var EXPIRES_IN = 60*60*8; //seconds (8 hrs)
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
  Client.findOne({E_Mail: email})
    .exec(function(error, client){
      if (error) return next(error, false, {});
      if (!client) return next(null, false,{
        code: 'INCORRECT_AUTHDATA',
        message:'Incorrect auth data'
      });

      //TODO: replace with new cipher service type
      if( !CipherService.comparePassword(password, client) ){
        return next(null, false, {
          code: 'INCORRECT_AUTHDATA',
          message:'Incorrect auth data'        
        });
      }

      Client.update({id : client.id},{ lastLogin : new Date() })
        .exec(function(err,ruser){
          if (error) return next(error, false, {});

          delete client.password;
          return next(null, client, {});
        });

  });
}

//Triggers when user authenticates via JWT strategy

function _onJwtStrategyAuth(payload, next){
  var payloadUser = payload.user || {};
  var clientId = payloadUser.id || false;
  if(!clientId){
    return next(null, false, {
      code: 'USER_ID_UNDEFINED',
      message: 'USER ID UNDEFINED'
    });
  }

  return Client.findOne({id: clientId})
    .then(function(clientFound){
      var client = clientFound;

      /*
      if(!client.active){
        return next(null, false, {
          code: 'client_NOT_ACTIVE',
          message: 'client NOT ACTIVE'
        });        
      }
      */

      return next(null, client, {});
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
      //var express = require('express');
      //app.use(express.compress());      
      var compression = require('compression');
      app.use(compression());
      app.use(timeout(timeoutSeconds+'s'));
      app.use(Files.middleware);
    }
  }
};
