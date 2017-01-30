/**
 * Season.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  tableName: 'Dates',
  schema: true,
  attributes: {
    idDates: {
      type: 'integer',
      required: true
    },
    StartDate: {
      type: 'date',
      required: true
    },
    EndDate: {
      type: 'date',
      required: true
    },
    Days: {
      type: 'integer'
    },
    Active: {
      type: 'string'
    }
  }
};

