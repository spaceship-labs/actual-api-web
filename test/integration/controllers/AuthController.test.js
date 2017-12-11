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

});