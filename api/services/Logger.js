module.exports = {
  log: function(user, message, action, references) {
    //sails.log(action + ': ' + message, references);
    return LoggingWeb.create({
    	user: user, 
    	message: message, 
    	action: action, 
    	references: references
    });
  }
};
