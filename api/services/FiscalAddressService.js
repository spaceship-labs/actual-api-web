module.exports = {
  updateFiscalAddress,
  validateSapFiscalClientUpdate
};

function validateSapFiscalClientUpdate(sapData){
	if(sapData.type === ClientService.CARDCODE_TYPE && ClientService.isValidCardCode(sapData.result)  ){
		return true;
	}	
	if(sapData.type === ClientService.ERROR_TYPE){
    throw new Error(sapData.result);
  }
  throw new Error('Error al actualizar datos fiscales en SAP');
}


async function updateFiscalAddress(params, req) {
  var CardCode = req.user.CardCode;
  var fiscalAddress = ClientService.mapFiscalFields(params);
  delete params.AdresType;

  try{
    if(!params.LicTradNum || !ClientService.isValidRFC(params.LicTradNum)){
      throw new Error('RFC no valido');
    }
    
    const sapResult = await SapService.updateFiscalAddress(CardCode, fiscalAddress);
    sails.log.info('updateFiscalAddress response', sapResult);
    const sapData = JSON.parse(sapResult.value);
    validateSapFiscalClientUpdate(sapData);

    const fiscalAddressesUpdated = await FiscalAddress.update({CardCode:CardCode}, fiscalAddress);
    const fiscalAddressUpdated = fiscalAddressesUpdated[0];
    const clientsUpdated =  await Client.update(
      {CardCode: CardCode}, 
      {LicTradNum: params.LicTradNum, cfdiUse: params.cfdiUse}
    );
    return fiscalAddressUpdated;
  }catch(err){
    throw new Error(err);
  }
}