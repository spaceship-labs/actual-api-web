module.exports = {
  createContact
};

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
    var isValidSapResponse = ClientService.isValidSapContactCreation(sapData);

    if( !sapData || isValidSapResponse.error  ) {
      var defualtErrMsg = 'Error al crear contacto en SAP';
      var err = isValidSapResponse.error || defualtErrMsg;
      if(err === true){
        err = defualtErrMsg;
      }
      throw new Error(err);
    }
    const CntctCode  = sapData[0].result;
    params.CntctCode = parseInt(CntctCode);
    const createdContact = await ClientContact.create(params);
    return createdContact;
  }
  catch(err){
    throw new Error(err);
  }
}

