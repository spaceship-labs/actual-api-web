module.exports = setupDefaultData;

function setupDefaultData(req, res, next){
	sails.log.info('setupDefaultData');
	Store.findOne({id:SiteService.getDefaultActiveStoreId(req)})
		.then(function(store){
			req.activeStore = store;
			sails.log.info('req.activeStore', req.activeStore);
			next();
		})
		.catch(function(err){
			console.log('err', err);
			next();
		});


}