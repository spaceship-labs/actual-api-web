module.exports = {
	getActiveStore: getActiveStore
};


function getActiveStore(req){
	var activeStore;
	if(req.user){
		return req.user.activeStore;
	}else{
		return req.defaultActiveStore;
	}
}