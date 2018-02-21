const _ = require('underscore');

module.exports = {
  createContact,
  updateContact,
  validateSapContactCreation,
  validateSapContactUpdate
};

function validateSapContactCreation(sapData){
  if(_.isArray(sapData)){
    const contact = sapData[0];
    if(contact.type === ClientService.PERSON_TYPE){
      return true;
    }
    if(contact.type === ClientService.ERROR_TYPE){
      throw new Error(contact.result);
    }
  }
  throw new Error('Error al crear contacto en SAP');
}

function validateSapContactUpdate(sapData){
  if(_.isArray(sapData)){
    const contact = sapData[0];
    if(contact.type === ClientService.PERSON_TYPE){
      return true;
    }
    if(contact.type === ClientService.ERROR_TYPE){
      throw new Error(contact.result);
    }
  }
  throw new Error('Error al actualizar contacto en SAP');
}


async function createContact(params, req){
  var cardCode = req.user.CardCode;
  params.CardCode = cardCode;
  params = ClientService.mapContactFields(params);

  try{
    const areValidZipcodes = await ClientService.validateContactsZipcode([params])
    if(!areValidZipcodes){
      throw new Error('El código postal no es valido para tu dirección de entrega');
    }
    
    const sapResult = await SapService.createContact(cardCode, params);
    sails.log.info('response createContact', sapResult);
    var sapData = JSON.parse(sapResult.value);
    
    validateSapContactCreation(sapData);

    const CntctCode  = sapData[0].result;
    params.CntctCode = parseInt(CntctCode);
    const createdContact = await ClientContact.create(params);
    return createdContact;
  }
  catch(err){
    throw new Error(err);
  }
}

async function updateContact(params){
  const contactCode = params.CntctCode;
  const cardCode = params.CardCode;
  params = ClientService.mapContactFields(params);

  try{
    const areValidZipcodes = await ClientService.validateContactsZipcode([params])
    if(!areValidZipcodes){
      throw new Error('El código postal no es valido para tu dirección de entrega');
    }
    const contacts = await ClientContact.find({ CardCode: cardCode, select: ['CntctCode'] })
    const contactIndex = ClientService.getContactIndex(contacts, contactCode);
    const sapResult = await SapService.updateContact(cardCode, contactIndex, params);
    sails.log.info('updateContact response', sapResult);

    const sapData = JSON.parse(sapResult.value);
    validateSapContactUpdate(sapData);
      
    const updatedContacts = await ClientContact.update(
      { CardCode: cardCode, CntctCode: contactCode },
      params
    );

    return updatedContacts[0];
  }catch(err){
    throw new Error(err);
  }
}


