const _ = require('underscore');
const moment  = require('moment');
const Promise = require('bluebird');
const ADDRESS_TYPE 		= 'B';
const ADDRESS_TYPE_B 		= 'B';
const ADDRESS_TYPE_S 		= 'S';
const CLIENT_DATE_FORMAT = 'MM/DD/YYYY';
const CARDCODE_TYPE = 'CardCode';
const PERSON_TYPE = 'Person';
const ERROR_TYPE = 'Error';
const ACTUAL_EMAIL_DOMAIN = /@actualgroup.com$/;


module.exports = {
	ADDRESS_TYPE,
	ADDRESS_TYPE_B,
	ADDRESS_TYPE_S,
	ERROR_TYPE,
	CARDCODE_TYPE,
	areContactsRepeated,
	createClient,
	updateClient,
	filterContacts,
	getContactIndex,
	isValidContactCode,
	isValidFiscalAddress,
	isValidRFC,
	validateSapClientCreation,
	isValidSapClientUpdate,
	isValidSapContactCreation,
	isValidSapContactUpdate,
	mapClientFields,
	mapContactFields,
	mapFiscalFields,
	isValidCardCode,
	validateContactsZipcode,
	clientsIdSearch,
};

function clientsIdSearch(term, searchFields){
  var query = {};
  if(searchFields.length > 0){
    query.or = [];
    for(var i=0;i<searchFields.length;i++){
      var field = searchFields[i];
      var obj = {};
      obj[field] = {contains:term};
      query.or.push(obj);
    }
  }
  return Client.find(query)
    .then(function(clients){
      if(!clients){
        return [];
      }
      return clients.map(function(c){return c.id;});
    });
}

function validateContactsZipcode(contacts){
	return Promise.map(contacts,function(contact){
		return Shipping.isValidZipcode(contact.U_CP);
	})
	.then(function(results){
		return _.every(results,function(isValid){
			return isValid;
		});
	});
}

function mapClientFields(fields){
  fields.CardName = fields.FirstName || fields.CardName;
  if(fields.FirstName && fields.LastName){
    fields.CardName = fields.FirstName + ' ' + fields.LastName;
  }
  if(fields.Birthdate){
  	fields.Birthdate = moment(fields.Birthdate).format(CLIENT_DATE_FORMAT);
  }
  return fields;
}

function mapFiscalFields(fields){
	fields.Address = fields.companyName;
	fields.AdresType = ADDRESS_TYPE;
	return fields;
}

function getContactIndex(contacts, contactCode){
  if(contacts.length === 1){
  	return 0;
  }
  var contactCodes = contacts.map(function(c){
    return parseInt(c.CntctCode);
  });
  contactCodes = contactCodes.sort(function(a,b){
    return a - b;
  });
  return contactCodes.indexOf(contactCode);
}

function filterContacts(contacts){
  var filteredContacts = (contacts || []).filter(function(contact){
    return !_.isUndefined(contact.FirstName);
  });
  return filteredContacts;
}

function isValidFiscalAddress(fiscalAddress){
  return !_.isUndefined(fiscalAddress.companyName);
}

function isValidRFC(rfc){
	return rfc.length === 12 || rfc.length === 13;
}

function isValidContactCode(contactCode){
	return !isNaN(contactCode);
}

function validateSapClientCreation(sapData, sapContactsParams, sapFiscalAddressParams){
	if(sapData.type === CARDCODE_TYPE && isValidCardCode(sapData.result) && _.isArray(sapData.pers) ){
		if(sapContactsParams.length === sapData.pers.length){
			return true;
		}
	}
	if(sapData.type === ERROR_TYPE){
		throw new Error(sapData.result);
	}	
	throw new Error('Error al crear cliente en SAP');
}

function isValidSapClientUpdate(sapData){
	var result = {error:true};
	if(sapData.type === ERROR_TYPE){
		result = {error: sapData.result || true};
	}
	
	if(sapData.type === CARDCODE_TYPE && isValidCardCode(sapData.result) ){
		result = {error: false};
	}
	
	return result;
}

function isValidSapFiscalClientUpdate(sapData){
	var result = {error:true};
	if(sapData.type === ERROR_TYPE){
		result = {error: sapData.result || true};
	}
	
	if(sapData.type === CARDCODE_TYPE && isValidCardCode(sapData.result)  ){
		result = {error: false};
	}
	
	return result;
}

function isValidSapContactCreation(sapData){
	var result = {error:true};
	var contact;

	if( !_.isArray(sapData) ) {
		result = {error: true};
	}

	contact = sapData[0];

	if(contact.type === ERROR_TYPE){
		result = {error: contact.result || true};
	}
	
	if(contact.type === PERSON_TYPE ){
		result = {error:false};
	}
	
	return result;
}

function isValidSapContactUpdate(sapData){
	var result = {error:true};
	var contact;

	if( !_.isArray(sapData) ) {
		result = {error: true};
	}

	contact = sapData[0];

	if(contact.type === ERROR_TYPE){
		result = {error: contact.result || true};
	}
	
	if(contact.type === PERSON_TYPE ){
		result = {error:false};
	}
	
	return result;
}

function areContactsRepeated(contacts){
	contacts = contacts.map(mapContactFields);
	var contactsNames = contacts.map(function(contact){
		return contact.Name;
	});
	var areRepeated = contactsNames.some(function(contact, idx){ 
	    return contactsNames.indexOf(contact) != idx; 
	});		
	return areRepeated;
}

function isValidCardCode(cardCode){
  if(!cardCode){
    return false;
  }
  return cardCode.length <= 15;
}

function isValidContact(contact){
	return true;
}

function mapContactFields(fields){
  fields.E_MailL = fields.E_Mail;
  fields.Name = fields.FirstName;
  if(fields.LastName){
  	fields.Name += ' ' + fields.LastName;
  }
  return fields;
}

async function createClient(params, req){
	var sapFiscalAddressParams;
	var sapContactsParams;
	const email = params.E_Mail;
	try{
    if(!email){	
			throw new Error('Email requerido');
		}
    if(email && email.match(ACTUAL_EMAIL_DOMAIN)){
			throw new Error('Email no valido');
		}
    if(params.LicTradNum && !isValidRFC(params.LicTradNum)){
			throw new Error('RFC no valido');
    }

    const createParams = mapClientFields(params);
    const filteredContacts = filterContacts(createParams.contacts)
    sapContactsParams = filteredContacts.map(mapContactFields);
    
    if(sapContactsParams.length > 0 && areContactsRepeated(sapContactsParams)){
			throw new Error('Nombres de contactos repetidos');
    }

    if(params.fiscalAddress && isValidFiscalAddress(params.fiscalAddress)){
      const fiscalAddressAux  = _.clone(params.fiscalAddress);
      sapFiscalAddressParams  = mapFiscalFields(fiscalAddressAux);
    }

    const sapClientParams = _.clone(params);
    var sapCreateParams = {
      client: sapClientParams,
      fiscalAddress: sapFiscalAddressParams || {},
      clientContacts: sapContactsParams,
      activeStore: req.activeStore
    };

    const password = _.clone(sapCreateParams.client.password);
    delete sapCreateParams.client.password;

		const areValidZipcodes = await validateContactsZipcode(sapCreateParams.clientContacts);
		if(!areValidZipcodes){
			throw new Error('El código postal no es valido para tu dirección de entrega');
		}

		const isUserEmailTaken = await UserService.checkIfUserEmailIsTaken(email);
		if(isUserEmailTaken){
			throw new Error('Email previamente utilizado');
		}      
		
		const sapResult = await SapService.createClient(sapCreateParams);
		sails.log.info('SAP result createClient', sapResult);
		const sapData = JSON.parse(sapResult.value);
		if(!sapData){
			throw new Error('Error al crear cliente en SAP');	
		}
		
		validateSapClientCreation(
			sapData, 
			sapContactsParams, 
			sapFiscalAddressParams
		);
	
		const clientCreateParams = Object.assign(sapClientParams,{
			CardCode: sapData.result,
			BirthDate: moment(sapClientParams.BirthDate).toDate()
		});

		const contactCodes = sapData.pers;
		const contactsParams = sapContactsParams.map(function(c, i){
			c.CntctCode = contactCodes[i];
			c.CardCode = clientCreateParams.CardCode
		});

		sails.log.info('contacts app', contactsParams);
		sails.log.info('client app', clientCreateParams);
		
		const createdClient = await Client.create(clientCreateParams);
		const createdUser = await UserService.createUserFromClient(createdClient, password, req);
		const updatedClients = await Client.update({id: createdClient.id},{UserWeb: createdUser.id});
		const updatedClient = updatedClients[0];

		if(contactsParams && contactsParams.length > 0){
			const contactsCreated = await ClientContact.create(contactsParams);
		}

		//Created automatically, do we need the if validation?
		if(sapFiscalAddressParams){
			var fiscalAddressParams = mapFiscalFields(fiscalAddress);
			fiscalAddressParams = Object.assign(fiscalAddressParams, {
				CardCode: createdClient.CardCode,
				AdresType: ADDRESS_TYPE_S
			});

			var fiscalAddressParams2 = Object.assign(fiscalAddressParams,{
				AdresType: ADDRESS_TYPE_B
			});

			const fiscalAddressesCreated = await FiscalAddress.create([
				fiscalAddressParams,
				fiscalAddressParams2
			]);
		}

		if(fiscalAddressesCreated){
			sails.log.info('fiscal adresses created', fiscalAddressesCreated);
		}

		return {
			createdClient: updatedClient, 
			contactsCreated, 
			fiscalAddressesCreated
		};
	}
	catch(err){
		throw new Error(err);
	}
}

async function updateClient(params, req){
	const CardCode = _.clone(req.user.CardCode);
	const email = params.E_Mail;
	const userId = req.user ? req.user.id : false;
	
	delete params.FiscalAddress;
	delete params.Balance;

	const updateParams = mapClientFields(params);

	try{
		if(!email){
			throw new Error('Email requerido');
		}
		if(!userId){
			throw new Error('No autorizado');
		}

		const isUserEmailTaken = await UserService.checkIfUserEmailIsTaken(email, userId);
		//const isClientEmailTaken = await Client.findOne({E_Mail:email, id: {'!=': params.id}});
		
		//if(isUserEmailTaken || isClientEmailTaken){
		if(isUserEmailTaken){	
			throw new Error('Email previamente utilizado');
		}
		sails.log.info('params', params);
			
		const clientAsociated = await Client.findOne({UserWeb: userId, CardCode: CardCode});	
		if(!clientAsociated){
			throw new Error('No autorizado');
		}

		const sapResult = await SapService.updateClient(CardCode, params);
		sails.log.info('update client resultSap', sapResult);
		var sapData = JSON.parse(sapResult.value);
		var isValidSapResponse = isValidSapClientUpdate(sapData);

		if( !sapData || isValidSapResponse.error  ) {
			const defualtErrMsg = 'Error al actualizar datos personales en SAP';
			var err = isValidSapResponse.error || defualtErrMsg;
			if(err === true){
				err = defualtErrMsg;
			}
			sails.log.info('err', err);
			throw new Error(err);
		}

		const updatedClients = Client.update({CardCode: CardCode}, params);
		const updatedClient = updated[0];
		const usersUpdated = await UserService.updateUserFromClient(updateClient);
		const userUpdated = usersUpdated[0];
		return {
			updatedClient,
			updatedUser
		}
	}
	catch(err){
		throw new Error(err);
	}

}