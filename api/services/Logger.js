module.exports = {
  log: function(user, message, action, references) {
    //sails.log(action + ': ' + message, references);
    return LoggingWeb.create({
      client: user,
      message: message,
      action: action,
      references: references
    }).fetch();
  }
};
