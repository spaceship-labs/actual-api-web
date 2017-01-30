module.exports = {
  migrate:'alter',
  attributes:{
    name:{type:'string'},
    code:{type:'string', unique:true},
    paymentGroup1: {type:'boolean'},
    paymentGroup2: {type:'boolean'},
    paymentGroup3: {type:'boolean'},
    paymentGroup4: {type:'boolean'},
    paymentGroup5: {type:'boolean'},

    ewalletGroup1: {type:'boolean'},
    ewalletGroup2: {type:'boolean'},
    ewalletGroup3: {type:'boolean'},
    ewalletGroup4: {type:'boolean'},
    ewalletGroup5: {type:'boolean'},

    startDate: {type:'datetime'},
    endDate: {type:'datetime'},
  }
}
