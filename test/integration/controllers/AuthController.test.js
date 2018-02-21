describe('Auth controller', function(){

	describe('api status', function(){
		it('should return a valid response', async function(){
			var url = '/';
			try{
				const {body, status} = await app.get(url);
				expect(body.status).to.contain("ok");
				expect(status).to.equal(200);
			}catch(e){
				console.log('e', e);
			}
		});
	});

	describe('login process', function(){
		it('should return a token after a valid login', async function(){
			var url = '/auth/signin';
			try{
				const {body} = await app.post(url)
					.send({
						email: process.env.SAMPLE_ADMIN_USER_EMAIL,
						password: process.env.SAMPLE_ADMIN_USER_PASSWORD,
					})
					.set('accept', 'json');
				expect(body).to.have.property("token");
			}catch(e){
				console.log('e', e);
			}
		});

	});

});