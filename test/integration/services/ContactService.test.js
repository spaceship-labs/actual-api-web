describe("ContactService", function(){

  describe("validateSapContactCreation", function(){
    it("should return true when response is valid", function(){
      const sapData = [{type: ClientService.PERSON_TYPE}];
      expect(ContactService.validateSapContactCreation(sapData)).to.be.equal(true);
    });

    it("should throw a generic error when response is not valid", function(){
      const sapData = "wrong.response";
      expect(() => ContactService.validateSapContactCreation(sapData))
        .to.throw('Error al crear contacto en SAP');
    });

    it("should throw an specific error when response has an error message", function(){
      const errorMsg = "Error.message.sap";
      const sapData = [{
        type: ClientService.ERROR_TYPE,
        result: errorMsg
      }];
      expect(() => ContactService.validateSapContactCreation(sapData))
        .to.throw(errorMsg);
    });    
  });

  describe("validateSapContactUpdate", function(){
    it("should return true when response is valid", function(){
      const sapData = [{type: ClientService.PERSON_TYPE}];
      expect(ContactService.validateSapContactUpdate(sapData)).to.be.equal(true);
    });

    it("should throw a generic error when response is not valid", function(){
      const sapData = "wrong.response";
      expect(() => ContactService.validateSapContactUpdate(sapData))
        .to.throw('Error al actualizar contacto en SAP');
    });

    it("should throw an specific error when response has an error message", function(){
      const errorMsg = "Error.message.sap";
      const sapData = [{
        type: ClientService.ERROR_TYPE,
        result: errorMsg
      }];
      expect(() => ContactService.validateSapContactUpdate(sapData))
        .to.throw(errorMsg);
    });    
  });



});