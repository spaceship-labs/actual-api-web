var _ = require('underscore');
module.exports = {
	createUserFromClient: createUserFromClient,
	checkIfUserEmailIsTaken: checkIfUserEmailIsTaken,
	updateUserFromClient: updateUserFromClient,
	getCurrentUserClientId: getCurrentUserClientId,
	getCurrentUserId: getCurrentUserId,
	isUserAdminOrSeller: isUserAdminOrSeller
};

function getCurrentUserId(req){
  var userId = req.user ? req.user.id : false;
  return userId;
}

function isUserAdminOrSeller(req){
	var SELLER_ROLE = 'seller';
	var ADMIN_ROLE = 'admin';	
	return (req.user || {}).role === SELLER_ROLE || (req.user || {}).role === ADMIN_ROLE;
}


function getCurrentUserClientId(req){
	var currentUserClientId = req.user ? req.user.Client : false;
	return currentUserClientId;
}

function createUserFromClient(client, req){
	var activeStoreId = req.activeStore.id;

	var userToCreate = {
		Store: activeStoreId,
		email: client.E_Mail,
		firstName: client.FirstName,
		lastName: client.LastName,
		role: 'client',
		password: client.password,
		CardCode: client.CardCode,
		Client: client.id
	};

	return UserWeb.create(userToCreate);
}

function updateUserFromClient(client){
	var updateParams = {
		email: client.E_Mail,
		firstName: client.FirstName,
		lastName: client.LastName
	};
	var clientId = client.UserWeb;

	return UserWeb.update({id: clientId}, updateParams);	
}

function checkIfUserEmailIsTaken(email, userId){
	var query = {email: email};

	if(userId){
		query.id = {'!=': userId};
	}

	return UserWeb.findOne(query)
		.then(function(user){
			sails.log.info('checkIfUserEmailIsTaken', user);
			if( !_.isUndefined(user) ){
				return true;
			}else{
				return false;
			}
		});
}
