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

module.exports = {
	ADDRESS_TYPE,
	ADDRESS_TYPE_B,
	ADDRESS_TYPE_S,
	areContactsRepeated,
	filterContacts,
	getContactIndex,
	isValidContactCode,
	isValidFiscalAddress,
	isValidRFC,
	isValidSapClientCreation,
	isValidSapClientUpdate,
	isValidSapContactCreation,
	isValidSapContactUpdate,
	isValidSapFiscalClientUpdate,
	mapClientFields,
	mapContactFields,
	mapFiscalFields,
	populateClientRelations,
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

function isValidSapClientCreation(sapData, sapContactsParams, sapFiscalAddressParams){
	var result = {error:true};
	if(sapData.type === ERROR_TYPE){
		result = {error: sapData.result || true};
	}
	
	if(sapData.type === CARDCODE_TYPE && isValidCardCode(sapData.result) && _.isArray(sapData.pers) ){
		if(sapContactsParams.length === sapData.pers.length){
			result = {error: false};
		}
	}
	
	return result;
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

function populateClientRelations(client){
	var fiscalQuery = {
		CardCode: client.CardCode, 
		AdresType: ADDRESS_TYPE
	};

	return Promise.join(
		ClientContact.find({CardCode: client.CardCode}),
		FiscalAddress.findOne(fiscalQuery)
	)
	.then(function(results){
		var contacts = results[0];
		var fiscalAddress = results[1];

		client = client.toObject();
		client.Contacts = contacts;
		client.FiscalAddress = fiscalAddress;
		return client;
	});

}