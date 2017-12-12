describe('Auth controller', function(){

	describe('api status', function(){
		it('should return a valid response',function(done){
			var url = '/';
			app.get(url)
				.expect(200)
				.then(function(res){
					expect(res.body.status).to.equal("ok!");
					return Counter.create({name:'testCounter'});
				})
				.then(function(created){
					console.log('created', created);
					done();					
				})
				.catch(function(err){
					console.log('err', err);
					done();
				});
		});
	});

	describe('login process', function(){
		it('should return a token after a valid login', function(done){
			var url = '/auth/signin';
			app.post(url)
				.send({
					email: process.env.SAMPLE_ADMIN_USER_EMAIL,
					password: process.env.SAMPLE_ADMIN_USER_PASSWORD,
				})
			  .set('site', currentSiteKey)
			  .set('accept', 'json')
			  .then(function(res){
					expect(res.body).to.have.property("token");
			  	done();
			  });

		});

	});

});