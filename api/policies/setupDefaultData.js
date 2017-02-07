module.exports = setupDefaultData;

function setupDefaultData(req, res, next){
	if(req.user && req.user.activeStore){
		req.activeStore = req.user.activeStore;
		next();
	}
	else if(!req.activeStore){
		Store.findOne({id:SiteService.getDefaultActiveStoreId(req)})
			.then(function(store){
				req.activeStore = store;
				next();
			})
			.catch(function(err){
				console.log('err', err);
				next();
			});
	}


}