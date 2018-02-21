describe('CipherService', function(){
  it('should hash a password', function(){
    const password = 'password.test';
    const hashed = CipherService.hashPassword(password);
    expect(hashed).to.be.a('string');
    expect(hashed).to.not.equal(password);
  });

  it('should compare a password with it hash and return true if match', function(){
    const password = 'password.test';
    const hashed = CipherService.hashPassword(password);
    const user = {password: hashed};
    const result = CipherService.comparePassword(password, user);
    expect(hashed).to.be.a('string');
    expect(result).to.equal(true);
  });

  it('should compare a password with it hash and return false if dont match', function(){
    const password = 'password.test';
    const hashed = CipherService.hashPassword(password);
    const user = {password: hashed};
    const result = CipherService.comparePassword('wrong.password', user);
    expect(hashed).to.be.a('string');
    expect(result).to.equal(false);
  });

  it('should get a token from the user object', async function(){
    const user = await UserWeb.findOne({id:loggedInData.user.id});
    const result = CipherService.createToken(user);
    expect(result).to.be.a('string');    
  });


});