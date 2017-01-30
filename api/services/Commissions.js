var Promise = require('bluebird');
var moment  = require('moment');
var _       = require('underscore');
var IVA     = 0.16; // use it as 0.16 instead of 1.16

module.exports = {
  calculate: calculate,
  isPeriodBefore: isPeriodBefore,
};

function isPeriodBefore(date) {
  var today  = moment();
  var day = today.date();
  var month = today.month();
  var year = today.year();
  if (day < 16) {
    var current = moment([year, month]);
  } else {
    var current = moment([year, month, 16]);
  }
  var date = moment(date);
  return date < current;
}


function calculate() {
  var date  = new Date();
  var first = setFirstDay(new Date());
  var last  = setLastDay(new Date());
  if (date.getDate() <= 15) {
    var fdate = first;
    var ldate = addDays(first, 14);
  } else {
    var fdate = addDays(first, 15);
    var ldate = last;
  }
  var query = queryUpdateDate({}, fdate, ldate);
  return Quotation
      .find(query)
      .populate('User')
      .populate('Store')
      .populate('Payments')
      .then(function(quotations) {
        return quotations.map(function(q) {
          q.Payments = q.Payments.filter(function(pi) {
            var c1 = new Date(pi.createdAt);
            var fd = new Date(fdate);
            var ld = new Date(ldate);
            return c1 >= fd && c1 <= ld;
          });
          return q;
        });
      })
      .then(function(quotations) {
        var date   = setFirstDay(fdate);
        var query  = queryGoalDate({}, date);
        return [quotations, Goal.find(query)];
      })
      .spread(function(quotations, goals) {
        return [
          calculateManagers(quotations, goals),
          calculateSellers(quotations, goals),
        ];
      });
}

function calculateManagers(quotations, goals) {
  return Role
    .findOne({ name: 'store manager' })
    .then(function(manager){
      return User.find({ role: manager.id });
    })
    .then(function(users) {
      return formatManagers(users);
    })
    .then(function(users) {
      var pstores = paymentsByStore(quotations);
      var tstores = totalsByStore(quotations);
      var sgoals = goalsByStore(goals);
      var commissions = Object.keys(users)
        .map(function(uid) {
          var user = users[uid];
          var puser = pstores[user.mainStore] || [];
          var utotal = tstores[user.mainStore];
          var stotal = tstores[user.mainStore] || 0;
          var goal = sgoals[user.mainStore];
          var urate = rate(utotal / (1 + IVA), stotal / (1 + IVA), goal.goal, goal.sellers, true);
          var comuser = puser.map(function(p) {
            var q = { user: uid, payment: p.id, store: user.mainStore };
            return Commission
              .findOrCreate(q, q)
              .then(function(c) {
                var rate = p.type == 'ewallet' ? 0 : urate;
                var ammount = sumPayments([p]);
                var ammount = (rate * ammount / (1 + IVA)).toFixed(2);
                return Commission.update(q, {
                  rate: rate,
                  ammount: ammount,
                  ammountPayment: p.currency == 'usd' ? p.ammount * p.exchangeRate : p.ammount,
                  datePayment: p.createdAt,
                  role: 'store manager',
                });
              });
          });
          return Promise.all(comuser);
        });
      return Promise.all(commissions);
    });
}

function calculateSellers(quotations, goals) {
  var users  = getUsers(quotations);
  var pstores = paymentsByStore(quotations);
  var pusers  = paymentsByUser(quotations);
  var tstores = totalsByStore(quotations);
  var tusers  = totalsByUser(quotations);
  var sgoals = goalsByStore(goals);
  var commissions = Object.keys(users)
    .map(function(uid) {
      var user = users[uid];
      var puser = pusers[uid];
      var utotal = tusers[uid] || 0;
      var stotal = tstores[user.mainStore] || 0;
      var goal = sgoals[user.mainStore];
      var urate = rate(utotal / (1 + IVA), stotal / (1 + IVA), goal.goal, goal.sellers);
      var comuser = puser.map(function(p) {
        var q = { user: uid, payment: p.id, store: user.mainStore };
        return Commission
          .findOrCreate(q, q)
          .then(function(c) {
            var rate = p.type == 'ewallet' ? 0 : urate;
            var ammount = sumPayments([p]);
            var ammount = (rate * ammount / (1 + IVA)).toFixed(2);
            return Commission.update(q, {
              rate: rate,
              ammount: ammount,
              ammountPayment: p.currency == 'usd' ? p.ammount * p.exchangeRate : p.ammount,
              datePayment: p.createdAt,
              role: 'seller',
            });
          });
      });
      return Promise.all(comuser);
    });
  return Promise.all(commissions);
}

function rate(utotal, stotal, goal, sellers, isManager) {
  // las metas se guardan como mensuales, pero las comisiones son quincenales
  goal /= 2;
  var gstore0 = goal * 0.90;
  var gstore1 = goal;
  var gstore2 = goal * 1.25;
  var gseller1 = goal / sellers;
  var gseller2 = (goal * 1.25) / sellers;
  if (!isManager) {
    var baseSeller = 3;
    if (utotal >= gseller1) {
      baseSeller += 1;
    }
    if (utotal >= gseller2) {
      baseSeller += 1;
    }
    if (utotal >= gseller1 && stotal >= gstore1) {
      baseSeller += 0.5;
    }
    if (utotal >= gseller2 && stotal >= gstore2) {
      baseSeller += 0.5;
    }
    return baseSeller / 100;
  }
  if (isManager) {
    var baseManager = 0;
    if (utotal >= gstore0) {
      baseManager += 0.5;
    }
    if (utotal >= gstore1) {
      baseManager += 0.5;
    }
    if (utotal >= gstore2) {
      baseManager += 1;
    }
    return baseManager / 100;
  }
  return 0;
}

function formatManagers(managers) {
  return managers.reduce(function(acum, m) {
    acum[m.id] = m;
    return acum;
  }, {});
}

function getUsers(quotations) {
  return quotations.reduce(function(acum, q) {
    acum[q.User.id] = q.User;
    return acum;
  }, {});
}

function goalsByStore(goals) {
  return goals.reduce(function(acum, g) {
    acum[g.store] = g;
    return acum;
  } , {});
}

function paymentsByStore(quotations) {
  return quotations.reduce(function(acum, q) {
    acum[q.Store.id] = (acum[q.Store.id] || []).concat(q.Payments);
    return acum;
  }, {});
}

function paymentsByUser(quotations) {
  return quotations.reduce(function(acum, q) {
    acum[q.User.id] = (acum[q.User.id] || []).concat(q.Payments);
    return acum;
  }, {});
}

function totalsByStore(quotations) {
  return quotations.reduce(function(acum, q) {
    acum[q.Store.id] = (acum[q.Store.id] || 0) + sumPayments(q.Payments);
    return acum;
  }, {});

}

function totalsByUser(quotations) {
  return quotations.reduce(function(acum, q) {
    acum[q.User.id] = (acum[q.User.id] || 0) + sumPayments(q.Payments);
    return acum;
  }, {});
}

function sumPayments(payments) {
  return payments.reduce(function(acum, current) {
    if (current.type == 'ewallet') {
      return acum;
    }
    if (current.currency == 'usd') {
      return acum + (current.ammount * current.exchangeRate);
    }
    return acum + current.ammount;
  }, 0);
}

function queryUpdateDate(query, dateFrom, dateTo) {
  var dateFrom = new Date(dateFrom);
  var dateTo   = new Date(dateTo);
  dateFrom.setHours(0, 0, 0, 0);
  dateTo.setHours(0, 0, 0, 0);
  return _.assign(query, {
    updatedAt: {
      '>=': dateFrom,
      '<': addOneDay(dateTo)
    }
  });
}

function queryDate(query, dateFrom, dateTo) {
  var dateFrom = new Date(dateFrom);
  var dateTo   = new Date(dateTo);
  dateFrom.setHours(0, 0, 0, 0);
  dateTo.setHours(0, 0, 0, 0);
  return _.assign(query, {
    createdAt: {
      '>=': dateFrom,
      '<': addOneDay(dateTo)
    }
  });
}

function queryGoalDate(query, date) {
  var date1 = moment(date);
  var date2 = moment(date);
  return _.assign(query, {
    date: {
      '>=': date1.add(-1, 'days').format('YYYY-MM-DD'),
      '<': date2.add(1, 'days').format('YYYY-MM-DD'),
    }
  });
}

function setLastDay(date) {
  var date = new Date(date);
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function setFirstDay(date) {
  var date = new Date(date);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addOneDay(date) {
  var date = new Date(date);
  date.setDate(date.getDate() + 1);
  return date;
}

function addDays(date, days) {
  var date = new Date(date);
  date.setDate(date.getDate() + days);
  return date;
}

