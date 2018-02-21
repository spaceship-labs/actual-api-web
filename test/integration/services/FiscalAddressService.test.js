describe("FiscalAddressService", function(){

  describe("validateSapFiscalClientUpdate", function(){
    it("should return true when response is valid", function(){
      const sapData = {
        type: ClientService.CARDCODE_TYPE,
        result: "ML6004082"
      };
      expect(FiscalAddressService.validateSapFiscalClientUpdate(sapData)).to.be.equal(true);
    });

    it("should throw a generic error when response is not valid", function(){
      const sapData = "wrong.response";
      expect(() => FiscalAddressService.validateSapFiscalClientUpdate(sapData))
        .to.throw('Error al actualizar datos fiscales en SAP');
    });

    it("should throw an specific error when response has an error message", function(){
      const errorMsg = "Error.message.sap";
      const sapData = {
        type: ClientService.ERROR_TYPE,
        result: errorMsg
      };
      expect(() => FiscalAddressService.validateSapFiscalClientUpdate(sapData))
        .to.throw(errorMsg);
    });    
  });



});