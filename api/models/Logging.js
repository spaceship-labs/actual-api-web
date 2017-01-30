//APP COLLECTION
/**
 * Logging.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
  attributes: {
    user: {
      model: 'user',
      required: true
    },
    message: {
      type: 'string',
      required: true
    },
    action: {
      type: 'string',
      enum: ['login', 'pointer'],
      required: true
    },
    references: {
      type: 'json'
    }
  }
};

