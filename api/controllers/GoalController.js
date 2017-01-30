/**
 * GoalController
 *
 * @description :: Server-side logic for managing goals
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var _ = require('underscore');
var moment = require('moment');

module.exports = {
  find: function(req, res) {
    var form = req.allParams();
    var model = 'goal';
    var extraParams = {
      searchFields: ['goal', 'sellers', 'date'],
      populateFields: ['store']
    };
    Common.find(model, form, extraParams).then(function(result){
      res.ok(result);
    },function(err){
      res.notFound();
    });
  },

  findById: function(req, res) {
    var form = req.allParams();
    var id   = form.id;
    Goal
      .findOne(id)
      .then(function(goal) {
        return res.json(goal);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  create: function(req, res) {
    var form = req.allParams();
    var goal = form.goal;
    exists(goal)
      .then(function(entries) {
        if (entries) {
          return Promise.reject({
            originalError: 'No pueden existir reglas duplicadas. Corrija las reglas y reintente',
            entries: entries
          });
        }
        return Goal.create(goal);
      })
      .then(function(goal) {
        return res.json(goal);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  update: function(req, res) {
    var form = req.allParams();
    var goal = form.goal;
    Goal
      .update(goal.id, goal)
      .then(function(goal) {
        return res.json(goal);
      })
      .catch(function(err) {
        return res.negotiate(err);
      });
  },

  searchByDate: function(req, res) {
    var form  = req.allParams();
    var query = queryGoalDate({store: form.store}, form.dateFrom);
    Goal.findOne(query).exec(function(err, c) {
      if (err) {return res.negotiate(err);}
      return res.json(c);
    });
  }
};

function exists(goals) {
  var query = goals.map(function(goal) {
    return {
      store: goal.store,
      date: goal.date
    };
  });
  return Goal
    .find({or: query})
    .then(function(goals) {
      return goals.length > 0 && goals;
    });
}

function queryDate(query, dateFrom, dateTo) {
  var dateFrom = new Date(dateFrom);
  var dateTo   = new Date(dateTo);
  dateFrom.setHours(0, 0, 0, 0);
  dateTo.setHours(0, 0, 0, 0);
  return _.assign(query, {
    date: {
      '>=': dateFrom,
      '<': addOneDay(dateTo)
    }
  });
}

function addOneDay(date) {
  var date = new Date(date);
  date.setDate(date.getDate() + 1);
  return date;
}

function queryGoalDate(query, date) {
  date = setFirstDay(date);
  var date1 = moment(date);
  var date2 = moment(date);
  return _.assign(query, {
    date: {
      '>=': date1.add(-1, 'days').format('YYYY-MM-DD'),
      '<': date2.add(1, 'days').format('YYYY-MM-DD'),
    }
  });
}

function setFirstDay(date) {
  var date = new Date(date);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
