/**
 * CommissionController
 *
 * @description :: Server-side logic for managing commissions
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  find: function(req, res) {
    var form = req.params.all();
    var model = 'commission';
    var extraParams = {
      searchFields: ['user', 'rate', 'ammount'],
      populateFields: ['payment', 'user']
    };
    Common.find(model, form, extraParams).then(function(result){
      res.ok(result);
    },function(err){
      res.notFound();
    });
  },

  total: function(req, res) {
    var form  = req.allParams();
    var query = {
      user: form.user,
      datePayment: {
        '>=': form.dateFrom,
        '<': form.dateTo
      }
    };
    Commission
      .find(query)
      .then(function(commissions) {
        var commission = commissions.reduce(function(acum, current) {
          return acum + current.ammount;
        }, 0);
        var total = commissions.reduce(function(acum, current) {
          return acum + current.ammountPayment;
        }, 0);
        return [commission, total];
      })
      .spread(function(commissions, total) {
        return res.json({
          commissions: commissions,
          total: total
        });
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  report: function(req, res) {
    var form  = req.allParams();
    var until = form.createdAt['<'];
    var isPeriodBefore = Commissions.isPeriodBefore(until);
    if (!isPeriodBefore) {
      return res.negotiate(new Error('No se pueden correr reportes de este periodo'));
    }
    var query = {
      createdAt: form.createdAt,
    };
    if (form.user) {
      query['user'] = form.user;
    }
    if (form.store) {
      query['store'] = form.store;
    }
    Commission.update(query, {status: 'paid'}).exec(function(err, commissions){
      if (err) {
        return res.negotiate(err);
      }
      return  res.json(commissions);
    });
  },

  all: function(req, res) {
    var form  = req.allParams();
    var query = {
      createdAt: form.createdAt,
    };
    if (form.user) {
      query['user'] = form.user;
    }
    if (form.store) {
      query['store'] = form.store;
    }
    Commission.find(query).populate('user').populate('store').exec(function(err, commissions){
      if (err) {
        return res.negotiate(err);
      }
      return  res.json(commissions);
    });
  },
};
