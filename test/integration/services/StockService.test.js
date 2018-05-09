const moment = require('moment');
describe('StockService', function() {
  describe('findValidDelivery', function() {
    it('should find and return a valid delivery for a specific quotation detail', function() {
      const originalDeliveryDate = moment()
        .add(5, 'days')
        .startOf('day')
        .toDate();
      const deliveryDate = moment()
        .add(11, 'days')
        .startOf('day')
        .toDate();

      const detail = {
        quantity: 2,
        immediateDelivery: false,
        originalShipDate: originalDeliveryDate,
        shipCompany: 'whs3',
        shipCompanyFrom: 'whs1',
        Product: {
          ItemCode: 'ST112200'
        }
      };
      const groupedDeliveryDates = [
        {
          ImmediateDelivery: false,
          available: 12,
          date: originalDeliveryDate,
          companyFrom: 'whs1',
          company: 'whs3',
          itemCode: 'ST112200'
        },
        {
          ImmediateDelivery: false,
          available: 12,
          date: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          companyFrom: 'whs2',
          company: 'whs3',
          itemCode: 'ST112200'
        }
      ];
      const validatedDetails = [];
      const result = StockService.findValidDelivery(
        detail,
        groupedDeliveryDates,
        validatedDetails
      );
      expect(result).to.deep.equal(groupedDeliveryDates[0]);
    });

    it('should false when there is no valid delivery for a specific quotation detail, in this case the delivery date is not available', function() {
      const originalDeliveryDate = moment()
        .add(5, 'days')
        .startOf('day')
        .toDate();
      const deliveryDate = moment()
        .add(11, 'days')
        .startOf('day')
        .toDate();

      const detail = {
        quantity: 2,
        immediateDelivery: false,
        originalShipDate: originalDeliveryDate,
        shipCompany: 'whs3',
        shipCompanyFrom: 'whs1',
        Product: {
          ItemCode: 'ST112200'
        }
      };
      const groupedDeliveryDates = [
        {
          ImmediateDelivery: false,
          available: 12,
          date: moment()
            .add(30, 'days')
            .startOf('day')
            .toDate(),
          companyFrom: 'whs1',
          company: 'whs3',
          itemCode: 'ST112200'
        },
        {
          ImmediateDelivery: false,
          available: 12,
          date: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          companyFrom: 'whs2',
          company: 'whs3',
          itemCode: 'ST112200'
        }
      ];
      const validatedDetails = [];
      const result = StockService.findValidDelivery(
        detail,
        groupedDeliveryDates,
        validatedDetails
      );
      expect(result).to.be.equal(undefined);
    });

    it('should false when there is no valid delivery for a specific quotation detail, available stock is not enough', function() {
      const originalDeliveryDate = moment()
        .add(5, 'days')
        .startOf('day')
        .toDate();
      const deliveryDate = moment()
        .add(11, 'days')
        .startOf('day')
        .toDate();

      const detail = {
        quantity: 10,
        immediateDelivery: false,
        originalShipDate: originalDeliveryDate,
        shipCompany: 'whs3',
        shipCompanyFrom: 'whs1',
        Product: {
          ItemCode: 'ST112200'
        }
      };
      const groupedDeliveryDates = [
        {
          ImmediateDelivery: false,
          available: 5,
          date: originalDeliveryDate,
          companyFrom: 'whs1',
          company: 'whs3',
          itemCode: 'ST112200'
        },
        {
          ImmediateDelivery: false,
          available: 12,
          date: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          companyFrom: 'whs2',
          company: 'whs3',
          itemCode: 'ST112200'
        }
      ];
      const validatedDetails = [];
      const result = StockService.findValidDelivery(
        detail,
        groupedDeliveryDates,
        validatedDetails
      );
      expect(result).to.be.equal(undefined);
    });
  });

  describe('tagValidDetails', function() {
    it('should assign a validStock flag depending on detail valid stock', function() {
      const details = [
        {
          quantity: 2,
          immediateDelivery: false,
          originalShipDate: moment()
            .add(15, 'days')
            .startOf('day')
            .toDate(),
          shipCompany: 'whs3',
          shipCompanyFrom: 'whs1',
          Product: {
            ItemCode: 'ST112200',
            actual_studio: 12,
            U_FAMILIA: 'SI',
            Active: 'Y'
          }
        },
        {
          quantity: 4,
          immediateDelivery: false,
          originalShipDate: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          shipCompany: 'whs6',
          shipCompanyFrom: 'whs5',
          Product: {
            ItemCode: 'CO12345',
            actual_studio: 40,
            U_FAMILIA: 'SI',
            Active: 'Y'
          }
        }
      ];
      const groupedDeliveryDates = [
        {
          ImmediateDelivery: false,
          available: 6,
          date: moment()
            .add(30, 'days')
            .startOf('day')
            .toDate(),
          companyFrom: 'whs1',
          company: 'whs3',
          itemCode: 'ST112200'
        },
        {
          ImmediateDelivery: false,
          available: 12,
          date: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          companyFrom: 'whs2',
          company: 'whs3',
          itemCode: 'ST112200'
        },
        {
          ImmediateDelivery: false,
          available: 10,
          date: moment()
            .add(30, 'days')
            .startOf('day')
            .toDate(),
          company: 'whs6',
          companyFrom: 'whs5',
          itemCode: 'CO12345'
        },
        {
          ImmediateDelivery: false,
          available: 40,
          date: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          company: 'whs6',
          companyFrom: 'whs5',
          itemCode: 'CO12345'
        }
      ];

      const activeStore = {
        id: 'store.id1',
        code: 'actual_studio'
      };

      const result = StockService.tagValidDetails(
        details,
        groupedDeliveryDates,
        activeStore
      );

      expect(result[0].validStock).to.be.equal(false);
      expect(result[1].validStock).to.be.equal(true);
    });

    it('should assign a validStock flag to false when product has not U_FAMILIA set to "SI"', function() {
      const details = [
        {
          quantity: 4,
          immediateDelivery: false,
          originalShipDate: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          shipCompany: 'whs6',
          shipCompanyFrom: 'whs5',
          Product: {
            ItemCode: 'CO12345',
            actual_studio: 40,
            U_FAMILIA: '-',
            Active: 'Y'
          }
        }
      ];
      const groupedDeliveryDates = [
        {
          ImmediateDelivery: false,
          available: 10,
          date: moment()
            .add(30, 'days')
            .startOf('day')
            .toDate(),
          company: 'whs6',
          companyFrom: 'whs5',
          itemCode: 'CO12345'
        },
        {
          ImmediateDelivery: false,
          available: 40,
          date: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          company: 'whs6',
          companyFrom: 'whs5',
          itemCode: 'CO12345'
        }
      ];

      const activeStore = {
        id: 'store.id1',
        code: 'actual_studio'
      };

      const result = StockService.tagValidDetails(
        details,
        groupedDeliveryDates,
        activeStore
      );

      expect(result[0].validStock).to.be.equal(false);
    });

    it('should assign a validStock flag to false when product has not Active prop set to "Y"', function() {
      const details = [
        {
          quantity: 4,
          immediateDelivery: false,
          originalShipDate: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          shipCompany: 'whs6',
          shipCompanyFrom: 'whs5',
          Product: {
            ItemCode: 'CO12345',
            actual_studio: 40,
            U_FAMILIA: '-',
            Active: 'N'
          }
        }
      ];
      const groupedDeliveryDates = [
        {
          ImmediateDelivery: false,
          available: 10,
          date: moment()
            .add(30, 'days')
            .startOf('day')
            .toDate(),
          company: 'whs6',
          companyFrom: 'whs5',
          itemCode: 'CO12345'
        },
        {
          ImmediateDelivery: false,
          available: 40,
          date: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          company: 'whs6',
          companyFrom: 'whs5',
          itemCode: 'CO12345'
        }
      ];

      const activeStore = {
        id: 'store.id1',
        code: 'actual_studio'
      };

      const result = StockService.tagValidDetails(
        details,
        groupedDeliveryDates,
        activeStore
      );

      expect(result[0].validStock).to.be.equal(false);
    });

    it('should assign a validStock flag to false when product is a service (has a prop Service equal to Y)', function() {
      const details = [
        {
          quantity: 4,
          immediateDelivery: false,
          originalShipDate: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          shipCompany: 'whs6',
          shipCompanyFrom: 'whs5',
          Product: {
            ItemCode: 'SR00022',
            actual_studio: 40,
            U_FAMILIA: 'SI',
            Active: 'Y',
            Service: 'Y'
          }
        }
      ];
      const groupedDeliveryDates = [
        {
          ImmediateDelivery: false,
          available: 10,
          date: moment()
            .add(30, 'days')
            .startOf('day')
            .toDate(),
          company: 'whs6',
          companyFrom: 'whs5',
          itemCode: 'CO12345'
        },
        {
          ImmediateDelivery: false,
          available: 40,
          date: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          company: 'whs6',
          companyFrom: 'whs5',
          itemCode: 'CO12345'
        }
      ];

      const activeStore = {
        id: 'store.id1',
        code: 'actual_studio'
      };

      const result = StockService.tagValidDetails(
        details,
        groupedDeliveryDates,
        activeStore
      );

      expect(result[0].validStock).to.be.equal(false);
    });

    it('should assign a validStock flag to false when detail quantity is greater than product cache stock', function() {
      const details = [
        {
          quantity: 6,
          immediateDelivery: false,
          originalShipDate: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          shipCompany: 'whs6',
          shipCompanyFrom: 'whs5',
          Product: {
            ItemCode: 'ST12345',
            actual_studio: 4,
            U_FAMILIA: 'SI',
            Active: 'Y'
          }
        }
      ];
      const groupedDeliveryDates = [
        {
          ImmediateDelivery: false,
          available: 10,
          date: moment()
            .add(30, 'days')
            .startOf('day')
            .toDate(),
          company: 'whs6',
          companyFrom: 'whs5',
          itemCode: 'CO12345'
        },
        {
          ImmediateDelivery: false,
          available: 40,
          date: moment()
            .add(20, 'days')
            .startOf('day')
            .toDate(),
          company: 'whs6',
          companyFrom: 'whs5',
          itemCode: 'CO12345'
        }
      ];

      const activeStore = {
        id: 'store.id1',
        code: 'actual_studio'
      };

      const result = StockService.tagValidDetails(
        details,
        groupedDeliveryDates,
        activeStore
      );

      expect(result[0].validStock).to.be.equal(false);
    });
  });
});
