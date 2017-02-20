module.exports = {
	getDefaultActiveStoreId: getDefaultActiveStoreId,
	getSiteDisplayProperty: getSiteDisplayProperty
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

	}

	return activeStoreId;
}