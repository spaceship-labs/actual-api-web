module.exports = {
	getDefaultActiveStoreId: getDefaultActiveStoreId
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
			activeStoreId = Constants.ACTUAL_HOME_WEB_ID;
			break;

		default: 
			activeStoreId = Constants.ACTUAL_HOME_WEB_ID;
			break;
	}

	return activeStoreId;
}