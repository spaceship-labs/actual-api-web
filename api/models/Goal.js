/**
 * Goal.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    goal: {
      type: 'float',
      required: true
    },
    sellers: {
      type: 'integer',
      required: true
    },
    date: {
      type: 'date',
      required: true
    },
    store: {
      model: 'store',
      required: true
    }
  },
  beforeCreate: function(val, cb){
    var q = {
      store: val.store,
      date: val.date
    };
    Goal.findOne(q).exec(function(err, c) {
      if (err) {
        return cb(err);
      }
      if (c) {
        return cb('No pueden haber 2 reglas en la misma tienda, en la misma fecha');
      }
      cb();
    });
  },
  beforeUpdate: function(val, cb) {
    var q = {
      id: {'!': val.id},
      store: val.store,
      date: val.date
    };
    Goal.findOne(q).exec(function(err, c) {
      if (err) {
        return cb(err);
      }
      console.log(c);
      if (c) {
        return cb('No pueden haber 2 reglas en la misma tienda, en la misma fecha');
      }
      cb();
    });
  }
};

