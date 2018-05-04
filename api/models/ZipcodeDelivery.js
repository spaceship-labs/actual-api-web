module.exports = {
  schema: true,
  migrate:'alter',
  tableName: 'zipcode',
  attributes: {
    cp:{type:'string'},
    estado:{type:'string'},
    municipio:{type:'string'},
    asentamiento:{type:'string'},
    entrega:{
        type:'string',
        enum: ['SI', 'NO']
    },
    sin_armado:{type:'integer'},
    con_armado:{type:'integer'},
    dias_ent_bigticket:{type:'integer'},
    entrega_pta:{type:'integer'},
    dias_ent_softline:{type:'integer'},

    ZipcodeState: {model: 'ZipcodeState'}
  }
};
