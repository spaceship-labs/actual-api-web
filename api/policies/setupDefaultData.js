var passport = require('passport');
module.exports = setupDefaultData;

function setupDefaultData(req, res, next){
	Store.findOne({id:SiteService.getDefaultActiveStoreId(req)})
		.then(function(store){

			//Sets req.user, difference with isAutheticated: 
			//it doesnt returns forbidden when there isnt a user
			passport.authenticate('jwt', function (error, user, info) {
				if (error) return res.serverError(error);

				req.activeStore = store;
				if (!user){
					next();
				}else{
					req.user = user;
					next();
				}
			})(req, res);

		})
		.catch(function(err){
			console.log('err', err);
			next();
		});


}