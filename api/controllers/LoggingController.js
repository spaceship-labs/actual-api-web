/**
 * LoggingController
 *
 * @description :: Server-side logic for managing Loggings
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  create: function(req, res) {
    var form        = req.params.all();
    var user        = req.user || form.user;
    var message     = form.message;
    var action      = form.action;
    var references  = form.references || {};
    Logger.log(user, message, action, references).then(function(log) {
      return res.json(log);
    }).catch(function(err){
      return res.negotiate(err);
    });
  },

  find: function(req, res) {
    var form         = req.params.all();
    var query        = {};
    var paginate     = {
      page:  form.page  || 1,
      limit: form.limit || 5
    };
    if (form.user) {
      query.user = form.user;
    }
    Logging.find(query)
      .sort('createdAt DESC')
      .paginate(paginate)
      .populate('user').exec(function(err, log) {
        if (err) {return res.negotiate(err);}
        return res.json(log);
      });
  },



};

