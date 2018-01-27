module.exports = {
  updateFiscalAddress,
  isValidSapFiscalClientUpdate
};

function isValidSapFiscalClientUpdate(sapData){
	var result = {error:true};
	if(sapData.type === ClientService.ERROR_TYPE){
		result = {error: sapData.result || true};
	}
	
	if(sapData.type === ClientService.CARDCODE_TYPE && ClientService.isValidCardCode(sapData.result)  ){
		result = {error: false};
	}	
	return result;
}

async function updateFiscalAddress(params, req) {
  var CardCode = req.user.CardCode;
  var fiscalAddress = ClientService.mapFiscalFields(params);
  delete params.AdresType;

  try{
    if(!params.LicTradNum || !ClientService.isValidRFC(params.LicTradNum)){
      throw new Error('RFC no valido');
    }
    
    const sapResult = await SapService.updateFiscalAddress(CardCode, fiscalAddress)
    sails.log.info('updateFiscalAddress response', sapResult);
    const sapData = JSON.parse(sapResult.value);
    const isValidSapResponse = ClientService.isValidSapFiscalClientUpdate(sapData);

    if( !sapData || isValidSapResponse.error  ) {
      var defualtErrMsg = 'Error al actualizar datos fiscales en SAP';
      var err = isValidSapResponse.error || defualtErrMsg;
      if(err === true){
        err = defualtErrMsg;
      }
      sails.log.info('err reject', err);
      throw new Error(err);
    }

    const fiscalAddressesUpdated = await FiscalAddress.update({CardCode:CardCode}, fiscalAddress);
    const fiscalAddressUpdated = fiscalAddressesUpdated[0];
    const clientsUpdated =  await Client.update(
      {CardCode: CardCode}, 
      {LicTradNum: params.LicTradNum, cfdiUse: params.cfdiUse}
    )
    return fiscalAddressUpdated;
  }catch(err){
    throw new Error(err);
  }
}