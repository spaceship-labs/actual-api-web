module.exports = {
	getDefaultActiveStoreId: getDefaultActiveStoreId
};

function getDefaultActiveStoreId(req){
	return Constants.DEFAULT_WEB_STORE_ID;
}