/**
 * Permission.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    name: {
      type: 'string',
      unique: true,
      required: true
    },
    controller: {
      type: 'string',
      required: true
    },
    action: {
      type: 'string',
      required: true
    },

    //relations
    owners: {
      collection: 'user',
      via: 'permissions'
    }
  }
};

