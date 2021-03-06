module.exports = {
	getDefaultActiveStoreId: getDefaultActiveStoreId,
	getSiteDisplayProperty: getSiteDisplayProperty,
	getConektaKeyBySite: getConektaKeyBySite,
	getSocietyCodesByActiveStore: getSocietyCodesByActiveStore,
	getSiteKeyByRequest: getSiteKeyByRequest
};

function getDefaultActiveStoreId(req){
	//sails.log.info('req.headers', req.headers);
	var site = req.headers.site || 'actual-studio';
	var activeStoreId;

	switch(site){
		case 'actual-studio':
			activeStoreId = Constants.ACTUAL_STUDIO_WEB_ID;
			break;

		case 'actual-home':
			activeStoreId = Constants.ACTUAL_HOME_WEB_ID;
			break;

		case 'actual-kids':
			activeStoreId = Constants.ACTUAL_KIDS_WEB_ID;
			break;

		default: 
			activeStoreId = Constants.ACTUAL_STUDIO_WEB_ID;
			break;
	}

	return activeStoreId;
}

function getSiteKeyByRequest(req){
	var siteKey = req.headers.site;
	return siteKey;
}

function getConektaKeyBySite(req){
	//sails.log.info('req.headers', req.headers);
	var site = req.headers.site || 'actual-studio';
	var conektaKey;

	switch(site){
		case 'actual-studio':
			conektaKey = process.env.CONEKTA_KEY_STUDIO;
			break;

		case 'actual-home':
			conektaKey = process.env.CONEKTA_KEY_HOME;
			break;

		case 'actual-kids':
			conektaKey = process.env.CONEKTA_KEY_KIDS;
			break;

		default: 
			conektaKey = process.env.CONEKTA_KEY_STUDIO;
			break;
	}

	return conektaKey;
}


function getSiteDisplayProperty(req){
	var site = req.headers.site || 'actual-studio';
	var siteDisplayProperty;
	
	switch(site){
		case 'actual-studio':
			siteDisplayProperty = Constants.DISPLAY_PROPERTY_ACTUAL_STUDIO;
			break;

		case 'actual-home':
			siteDisplayProperty = Constants.DISPLAY_PROPERTY_ACTUAL_HOME;
			break;

		case 'actual-kids':
			siteDisplayProperty = Constants.DISPLAY_PROPERTY_ACTUAL_KIDS;
			break;

		default: 
			siteDisplayProperty = Constants.DISPLAY_PROPERTY_ACTUAL_STUDIO;
			break;
	}

	return siteDisplayProperty;
}

function getSocietyCodesByActiveStore(activeStore){
	var codes = [];
	switch(activeStore.name){
		case 'actualstudio.com':
			codes = ['001','003'];
			break;

		case 'actualhome.com':
			codes = ['002','003'];
			break;

		case 'actualkids.com':
			codes = ['004'];
			break;
	}

	return codes;

}