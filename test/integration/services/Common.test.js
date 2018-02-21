const moment = require('moment');

describe("Common service" ,function(){
  describe("nativeFindOne" ,  function(){
    it("should return a valid object when sending valid params", async function(){
      const criteria = {};
      const model = Site;
      const result = await Common.nativeFindOne(criteria, model);
      expect(result).to.be.an('object');
      expect(result.id).to.be.a('string');    
    });

    /*
    it("should return null when not founding a record", async function(){
      const criteria = {id: 'false.id'};
      const model = Site;
      const result = await Common.nativeFindOne(criteria, model);
      console.log('result', result);
      should.not.exist(result);
    });
    */
  });

  describe("nativeFind", function(){
    it("should return an array with object when query is valid", async function(){
      const criteria = {};
      const model = Company;
      const result = await Common.nativeFind(criteria, model);
      expect(result).to.be.an('array');
      expect(result[0]).to.be.an('object');
      expect(result[0].id).to.be.a('string');    
    });
  });

  describe("isInteger", function(){
    it("should return true when valid", function(){
      expect(Common.isInteger(5)).to.be.equal(true);
    });
    it("should return false when invalid", function(){
      expect(Common.isInteger(5.2)).to.be.equal(false);
    });
  });

  describe("isFloat", function(){
    it("should return true when valid", function(){
      expect(Common.isFloat(5.4)).to.be.equal(true);
    });
    it("should return false when invalid", function(){
      expect(Common.isFloat("wrong")).to.be.equal(false);
    });
  });

  describe("validateEmail", function(){
    it("should return true when valid", function(){
      const email = "good@example.com";
      expect(Common.validateEmail(email)).to.be.equal(true);
    });
    it("should return false when valid", function(){
      const email = "wrongexample.com";
      expect(Common.validateEmail(email)).to.be.equal(false);
    });
  });

  describe("getImgExtension", function(){
    it("should return the extension of the file", function(){
      const filename = "test-image.jpg";
      expect(Common.getImgExtension(filename)).to.be.equal("jpg");
    });
  });

  describe("getMonthDateRange", function(){
    it("should return an object with start and date properties, filled with the beginning date and end date", function(){
      const startDate = moment().startOf('month').toDate();
      const endDate = moment().endOf('month').toDate();
      const result = Common.getMonthDateRange();
      expect(result).to.deep.equal({
        start: startDate,
        end: endDate
      });
    });
  });

  describe("getFortnightRange", function(){
    it("should return the first day of the month and the 15th day of it, when day is in the first fortnight, for example day 8", function(){
      const date = moment().startOf("month").add(8,"days");
      const result = Common.getFortnightRange(date);
      expect(result).to.deep.equal({
        start: moment().startOf('month').toDate(),
        end: moment().date(15).endOf('day').toDate()
      });
    });

    it("should return the beginning of the 15th day of the month and the last day of it, when day is in the second fortnight, for example day 20", function(){
      const date = moment().startOf("month").add(20,"days");
      const result = Common.getFortnightRange(date);
      expect(result).to.deep.equal({
        start: moment().date(16).startOf("day").toDate(),
        end: moment().endOf("month").toDate()
      });
    });

    it("should throw an error when providing an invalid date", function(){
      const date = "invalid.date";
      expect(() => Common.getFortnightRange(date))
        .to.throw("Not a valid date");
    });

  });

  describe("numLeftPad", function(){
    it("should add necessary zero paddings to number", function(){
      const num = 23;
      expect(Common.numLeftPad(num, 6)).to.be.equal("000023");
    });

    it("shouldn't add zero paddings to number with 6 digits", function(){
      const num = 123456;
      expect(Common.numLeftPad(num, 6)).to.be.equal("123456");
    });

  });

});