const _ = require('underscore');
const bcrypt = require('bcrypt');
const Promise = require('bluebird');
module.exports = {
  createUserFromClient,
  checkIfUserEmailIsTaken,
  updateUserFromClient,
  getCurrentUserClientId,
  getCurrentUserId,
  isUserAdminOrSeller,
  generateRecoveryToken,
  validateRecoveryToken,
  doRegisterInvitation,
  doPasswordRecovery
};

function getCurrentUserId(req) {
  var userId = req.user ? req.user.id : false;
  return userId;
}

function isUserAdminOrSeller(req) {
  var SELLER_ROLE = 'seller';
  var ADMIN_ROLE = 'admin';
  return (
    (req.user || {}).role === SELLER_ROLE ||
    (req.user || {}).role === ADMIN_ROLE
  );
}

function getCurrentUserClientId(req) {
  var currentUserClientId = req.user ? req.user.Client : false;
  return currentUserClientId;
}

function createUserFromClient(client, password, req) {
  var activeStoreId = req.activeStore.id;

  var userToCreate = client.invited
    ? {
        Store: activeStoreId,
        email: client.E_Mail,
        firstName: client.FirstName,
        lastName: client.LastName,
        role: 'client',
        password: password,
        CardCode: client.CardCode,
        Client: client.id,
        invited: true
      }
    : {
        Store: activeStoreId,
        email: client.E_Mail,
        firstName: client.FirstName,
        lastName: client.LastName,
        role: 'client',
        password: password,
        CardCode: client.CardCode,
        Client: client.id
      };

  return UserWeb.create(userToCreate);
}

function generateRecoveryToken(userId, userEmail, userPassword){
  const values = userId + userEmail + userPassword;  
  const token = bcrypt.hashSync(values ,bcrypt.genSaltSync(10));  
  return token;
}

async function validateRecoveryToken(tokenReceived, email){
  const user = await UserWeb.findOne({email}, {select: ['id', 'email', 'password']});
  if(!user){
    throw new Error("User not found");
  }
  var realToken = user.id + user.email + user.password;
  return new Promise(function(resolve, reject){
    bcrypt.compare(realToken, tokenReceived, function(err, res){
      if(err) return reject(err);
      resolve(res);
    });
  });
}

async function doPasswordRecovery(user, req){
  const store = req.activeStore || {};  
  const token = UserService.generateRecoveryToken(user.id, user.email, user.password);
  var storeUrl = store.url_sandbox;
  if(process.env.MODE === 'production'){
    storeUrl = store.url;
  }
  const frontendURL =  storeUrl || 'http://actualstudio.com';
  var recoverURL =  frontendURL + '/reset-password?';
  recoverURL += 'token='+token;
  recoverURL += '&email='+user.email;
  const result = await Email.sendPasswordRecovery(user.firstName, user.email, recoverURL);
  return true;
}


async function doRegisterInvitation(user, req){
  const store = req.activeStore || {};  
  const token = UserService.generateRecoveryToken(user.id, user.email, user.password);
  var storeUrl = store.url_sandbox;
  if(process.env.MODE === 'production'){
    storeUrl = store.url;
  }
  const frontendURL =  storeUrl || 'http://actualstudio.com';
  var recoverURL =  frontendURL + '/complete-register?';
  recoverURL += 'token='+token;
  recoverURL += '&email='+user.email;
  recoverURL += '&completeRegister=1';
  const result = await Email.sendPasswordRecovery(user.firstName, user.email, recoverURL);
  return true;
}

function updateUserFromClient(client) {
  var updateParams = {
    email: client.E_Mail,
    firstName: client.FirstName,
    lastName: client.LastName
  };
  var userId = client.UserWeb;

  return UserWeb.update({ id: userId }, updateParams);
}

function checkIfUserEmailIsTaken(email, userId) {
  var query = { email: email };

  if (userId) {
    query.id = { '!=': userId };
  }

  return UserWeb.findOne(query).then(function(user) {
    //sails.log.info('checkIfUserEmailIsTaken', user);
    if (!_.isUndefined(user)) {
      return true;
    } else {
      return false;
    }
  });
}
