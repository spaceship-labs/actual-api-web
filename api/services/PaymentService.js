var Promise = require('bluebird');
var numeral = require('numeral');
var ObjectId = require('sails-mongo/node_modules/mongodb').ObjectID;

var EWALLET_TYPE = 'ewallet';
var CASH_USD_TYPE = 'cash-usd';
var EWALLET_GROUP_INDEX = 0;
var DEFAULT_EXCHANGE_RATE   = 18.78;


module.exports = {
  calculateQuotationAmountPaid: calculateQuotationAmountPaid,
  calculateUSDPayment: calculateUSDPayment,
  calculateQuotationAmountPaidGroup1: calculateQuotationAmountPaidGroup1,
  getPaymentGroupsForEmail: getPaymentGroupsForEmail,
  getMethodGroupsWithTotals: getMethodGroupsWithTotals,
  getPaymentGroups: getPaymentGroups,
  getExchangeRate: getExchangeRate,
  addPayment: addPayment
};

function addPayment(payment, quotationId, req){
  var paymentGroup  = payment.group || 1;
  var paymentCreated;
  var client;
  var quotationPayments = [];
  var exchangeRate;
  var quotation;
  var quotationUpdateParams;
  payment.QuotationWeb = quotationId;
  payment.Store = req.activeStore.id;
  payment.Client = req.user.id;

  var stockValidationPromise;
  if(payment.stockValidated){
    stockValidationPromise = Promise.resolve(true);
  }else{
    stockValidationPromise = StockService.validateQuotationStockById(quotationId, req);
  }

  return stockValidationPromise
    .then(function(isValidStock){

      if(!isValidStock){
        return Promise.reject(new Error('Inventario no suficiente'));
      }
      var findQuotation = QuotationWeb.findOne({id:quotationId}).populate('Payments');

      if(payment.type === EWALLET_TYPE){
        findQuotation.populate('Client');
      }

      return findQuotation;
    })
    .then(function(quotationFound){
      quotation = quotationFound;
      client = quotation.Client;
      return PaymentWeb.create(payment);
    })
    .then(function(_paymentCreated){
      paymentCreated = _paymentCreated;
      quotationPayments = quotation.Payments.concat([paymentCreated]);

      var promises = [
        calculateQuotationAmountPaid(quotationPayments, exchangeRate),
        calculateQuotationAmountPaidGroup1(quotationPayments, exchangeRate)
      ];

      if(payment.type === EWALLET_TYPE){
        promises.push(
          EwalletService.applyEwalletRecord(payment,{
            quotationId: quotationId,
            userId: req.user.id,
            client: client,
            paymentId: paymentCreated.id
          })
        );
      }

      return promises;
    })
    .spread(function(ammountPaid, ammountPaidPg1){
      quotationUpdateParams = {
        ammountPaid: ammountPaid,
        ammountPaidPg1: ammountPaidPg1,
        paymentGroup: paymentGroup
      };
      return QuotationService.nativeQuotationUpdate(quotationId, quotationUpdateParams);
    })
    .then(function(quotationUpdated){

      if(payment.returnQuotation){
        delete quotation.Payments;
        quotation.ammountPaid = quotationUpdateParams.ammountPaid;
        quotation.paymentGroup = quotationUpdateParams.paymentGroup;
        return quotation;
      }
      
      return paymentCreated;
    })
}

function calculateQuotationAmountPaid(quotationPayments, exchangeRate){
  var payments  = quotationPayments || [];

  var ammounts = payments.map(function(payment){
    if(payment.type === 'cash-usd'){
     return calculateUSDPayment(payment, exchangeRate);
    }
    return payment.ammount;
  });

  var ammountPaid = ammounts.reduce(function(paymentA, paymentB){
    return paymentA + paymentB;
  });

  return ammountPaid || 0;
}

function calculateQuotationAmountPaidGroup1(quotationPayments, exchangeRate){
  var payments  = _.clone(quotationPayments) || [];

  var paymentsG1 = payments.filter(function(payment){
    return payment.group === 1;
  });

  if(paymentsG1.length === 0 || !paymentsG1){
    return 0;
  }


  var ammounts = paymentsG1.map(function(payment){
    if(payment.type === 'cash-usd'){
     return calculateUSDPayment(payment, exchangeRate);
    }
    return payment.ammount;
  });

  var ammountPaidGroup1 = ammounts.reduce(function(paymentA, paymentB){
    return paymentA + paymentB;
  });

  return ammountPaidGroup1 || 0;
}

function calculateUSDPayment(payment, exchangeRate){
  return payment.ammount * exchangeRate;
}

function getExchangeRate(){
  return Common.nativeFindOne({handle:'actual-group'}, Site)
    .then(function(site){
      return site.exchangeRate || DEFAULT_EXCHANGE_RATE;
    });
}

function getMethodGroupsWithTotals(quotationId, activeStore, options){
  var methodsGroups = paymentGroups;
  var discountKeys = [
    'discountPg1',
    'discountPg2',
    'discountPg3',
    'discountPg4',
    'discountPg5'
  ];
      
  var totalsPromises = methodsGroups.map(function(mG) {
    var id = quotationId;
    var paymentGroup = mG.group || 1;
    var params = {
      financingTotals: options.financingTotals,
      update: false,
      paymentGroup: mG.group,
    };
    params.currentStore = activeStore.id;
    var calculator = QuotationService.Calculator();
    return calculator.getQuotationTotals(id, params);        
  });

  return Promise.all(totalsPromises)
    .then(function(totalsPromises) {
      return [
        totalsPromises,
        getExchangeRate()
      ];
    })
    .spread(function(totalsPromises, exchangeRate) {
      var totalsByGroup = totalsPromises || [];
      methodsGroups = methodsGroups.map(function(mG, index){
        mG.total = totalsByGroup[index].total || 0;
        mG.subtotal = totalsByGroup[index].subtotal || 0;
        mG.discount = totalsByGroup[index].discount || 0;
        mG.methods = mG.methods.map(function(m){
          var discountKey = discountKeys[mG.group - 1];
          m.discountKey = discountKey;
          m.total = mG.total;
          m.subtotal = mG.subtotal;
          m.discount = mG.discount;
          m.exchangeRate = exchangeRate;
          if(m.type === CASH_USD_TYPE){
            m.description = 'Tipo de cambio '+exrStr+' MXN';
          }
          else if(m.type === EWALLET_TYPE){
            //var balance = vm.quotation.Client.ewallet || 0;
            //m.description = getEwalletDescription(balance);
          }

          return m;
        });
        return mG;
      });
      return methodsGroups;
    })
    .then(function(methodsGroups) {
      var currentDate = new Date();
      var query = {
        startDate: {'<=': currentDate},
        endDate: {'>=': currentDate},
      };
      return [methodsGroups, PMPeriod.findOne(query)];
    })
    .spread(function(methodsGroups, validMethods) {
      var activeKeys = [
        'paymentGroup1',
        'paymentGroup2',
        'paymentGroup3',
        'paymentGroup4',
        'paymentGroup5'
      ];
      return methodsGroups.filter(function(m) {
        var index = m.group - 1;
        return validMethods[activeKeys[index]];
      });
    });
}

function getPaymentGroupsForEmail(quotation, activeStore) {
  return getMethodGroupsWithTotals(quotation, activeStore)
    .then(function(res) {
      var cash = [{
        name: 'Pago único',
        cards: 'Efectivo, cheque, deposito, transferencia, Visa, Mastercard, American Express',
        total: numeral(res[0].total).format('0,0.00'),
      }];
      res = res.slice(1);
      var methods  = res.reduce(function(acum, current) {
        return acum.concat(current.methods);
      }, []);
      methods = methods.map(function(mi) {
        return {
          name: mi.name,
          cards: mi.cards.join(','),
          total: numeral(mi.total).format('0,0.00'),
        };
      });
      return cash.concat(methods);
    });
}

function getPaymentGroups(){
  return paymentGroups;
}

var paymentGroups = [
  {
    group:1,
    discountKey:'discountPg1',
    methods: [
      {
        label:'1 pago con',
        name:'Una sola exhibición terminal',
        type:'single-payment-terminal',
        description:'VISA, MasterCard, American Express',
        cardsImages:['/cards/visa.png','/cards/mastercard.png','/cards/american.png'],
        cards:['Visa','MasterCard','American Express'],
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Banamex', value:'banamex'}
        ],
        currency: 'mxn',
        needsVerification: true,
        min:0,
        web: true
      },
    ]
  },
  {
    group:2,
    discountKey:'discountPg2',
    methods: [
      {
        label:'3',
        name:'3 meses sin intereses',
        type:'3-msi',
        msi:3,
        cardsImages:[
          '/cards/amexcard.png',
          '/cards/banamex.png',
          '/cards/bancomer.png',
        ],
        cards: [
          'Afirme',
          'American Express',
          'Banamex',
          'Banbajio',
          'Bancomer',
          'Banca Mifel',
          'Banco Ahorro Famsa',
          'Banjercito',
          'Banorte',
          'Banregio',
          'Inbursa',
          'Itaucard',
          'Ixe',
          'Liverpool Premium Card',
          'Santander',
          'Scotiabank'
        ],
        moreCards: true,
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Banamex', value:'banamex'},
          {label:'Bancomer', value:'bancomer'},
          {label:'Banorte', value:'banorte'},
          {label:'Santander', value:'santander'}
        ],
        currency: 'mxn',
        min:300,
        needsVerification: true,
        web:true
      }
    ]
  },
  {
    group:3,
    discountKey:'discountPg3',
    methods: [
      {
        label:'6',
        name:'6 meses sin intereses',
        type:'6-msi',
        msi:6,
        cardsImages:[
          '/cards/amexcard.png',
          '/cards/banamex.png',
          '/cards/bancomer.png',
        ],
        cards:[
          'Afirme',
          'American Express',
          'Banamex',
          'Banbajio',
          'Bancomer',
          'Banca Mifel',
          'Banco Ahorro Famsa',
          'Banjercito',
          'Banorte',
          'Banregio',
          'Inbursa',
          'Itaucard',
          'Ixe',
          'Liverpool Premium Card',
          'Santander',
          'Scotiabank'
        ],
        moreCards: true,
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Banamex', value:'banamex'},
          {label:'Bancomer', value:'bancomer'},
          {label:'Banorte', value:'banorte'},
          {label:'Santander', value:'santander'}
        ],
        currency: 'mxn',
        min:600,
        needsVerification: true,
        web:true
      },
      {
        label:'9',
        name:'9 meses sin intereses',
        type:'9-msi',
        msi:9,
        cardsImages:[
          '/cards/amexcard.png',
          '/cards/banamex.png',
          '/cards/bancomer.png',
        ],
        cards:[
          'American Express',
          'Banamex',
          'Bancomer',
          'Santander'
        ],
        moreCards: true,
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Banamex', value:'banamex'},
          {label:'Bancomer', value:'bancomer'},
          {label:'Santander', value:'santander'}
        ],
        currency: 'mxn',
        min:800,
        needsVerification: true,
        web:true
      },
    ]
  },
  {
    group:4,
    discountKey:'discountPg4',
    methods: [
      {
        label:'12',
        name:'12 meses sin intereses',
        type:'12-msi',
        msi:12,
        cardsImages:[
          '/cards/amexcard.png',
          '/cards/banamex.png',
          '/cards/bancomer.png',
        ],
        cards:[
          'American Express',
          'Afirme',
          'Banamex',
          'Bancomer',
          'Banbajio',
          'Banca Mifel',
          'Banco Ahorro Famsa',
          'Banjercito',
          'Banorte',
          'Banregio',
          'Inbursa',
          'Itaucard',
          'Ixe',
          'Liverpool Premium Card',
          'Santander',
          'Scotiabank'
        ],
        moreCards: true,
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Banamex', value:'banamex'},
          {label:'Bancomer', value:'bancomer'},
          {label:'Banorte', value:'banorte'},
          {label:'Santander', value:'santander'}
        ],
        currency: 'mxn',
        min: 1200,
        needsVerification: true,
        web:true
      },
    ]
  },
  {
    group:5,
    discountKey:'discountPg5',
    methods: [
      {
        label:'18',
        name:'18 meses sin intereses',
        type:'18-msi',
        msi:18,
        cardsImages:[
          '/cards/banamex.png',
          '/cards/amexcard.png'
        ],
        cards: [
          'American Express',
          'Banamex'
        ],
        terminals:[
          {label:'American Express', value:'american-express'},
          {label:'Banamex', value:'banamex'}
        ],
        currency: 'mxn',
        needsVerification: true,
        min:2000,
        web:true
      },
    ]
  },
];