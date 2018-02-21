describe("Logger", function(){
  describe("log", function(){
    it("should crete a log with the expected params", async function(){
      const user = loggedInData.user.id;
      const message = "test.message";
      const action = "login";
      const log = await Logger.log(user, message, action);
      expect(log.action).to.be.equal(action);
      expect(log.id).to.be.a("string");
    });
  });
});