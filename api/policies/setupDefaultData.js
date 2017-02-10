module.exports = setupDefaultData;

function setupDefaultData(req, res, next){
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