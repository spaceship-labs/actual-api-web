module.exports = {
  tableName:'Broker',
  schema:true,
  migrate:'alter',
  attributes:{
    Code:{type:'string'},
    Name:{type:'string'},
    U_email:{type:'string'}
  }
};
