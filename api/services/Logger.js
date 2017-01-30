module.exports = {
  log: function(user, message, action, references) {
    sails.log(action + ': ' + message, references);
    return Logging.create({user: user, message: message, action: action, references: references});
  }
};
