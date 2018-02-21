describe("UserService", function(){
  describe("getRecoveryToken", function(){
    it("should generate a token for an specific user", async function(){
      const users = await UserWeb.find({}).limit(1);
      const user = users[0];
      const token = UserService.generateRecoveryToken(user.id, user.email, user.password);
      expect(token).to.be.a('string');
    });
  });

  describe("validateRecoveryToken", function(){
    it("should return true if the token is valid", async function(){
      const users = await UserWeb.find({}).limit(1);
      const user = users[0];
      const token = UserService.generateRecoveryToken(user.id, user.email, user.password);
      const result = await UserService.validateRecoveryToken(token, user.email);
      expect(result).to.be.equal(true);
    });

    it("should return false if the token is invalid", async function(){
      const users = await UserWeb.find({}).limit(1);
      const user = users[0];
      const token = "false.token";
      const result = await UserService.validateRecoveryToken(token, user.email);
      expect(result).to.be.equal(false);
    });

  });
});