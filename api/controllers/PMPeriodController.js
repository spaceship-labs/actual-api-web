module.exports = {
  create: function(req, res){
    var form = req.params.all();
    var startDate = new Date(form.startDate);
    var endDate = new Date(form.endDate);
    overlapsRange(startDate, endDate).then(function(overlaps){
      if(!overlaps){
        PMPeriod.create(form).then(function(created){
          return res.json(created);
        })
        .catch(function(err){
          console.log(err);
          return res.negotiate(err);
        });
      }else{
        return res.json({overlaps:true});
      }
    }).catch(function(err){
      console.log(err);
      res.negotiate(err);
    });

  },

  update: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var startDate = new Date(form.startDate);
    var endDate = new Date(form.endDate);
    overlapsRange(startDate, endDate, id).then(function(overlaps){
      if(!overlaps){
        PMPeriod.update({id:id},form).then(function(created){
          res.json(created);
        })
        .catch(function(err){
          console.log(err);
          res.negotiate(err);
        });
      }else{
        res.json({overlaps:true});
      }
    }).catch(function(err){
      console.log(err);
      res.negotiate(err);
    });
  },

  find: function(req, res){
    var form = req.params.all();
    var model = 'pmperiod';
    var extraParams = {
      searchFields: ['name', 'code'],
      selectFields: form.fields
    };
    Common.find(model, form, extraParams)
      .then(function(result){
        res.ok(result);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },
  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    PMPeriod.findOne({id:id})
      .then(function(pma){
        res.json(pma);
      })
      .catch(function(err){
        res.negotiate(err);
      });
  },
  getActive: function(req, res){
    var form = req.params.all();
    //Today range
    var currentDate = new Date();
    var query = {
      startDate: {'<=': currentDate},
      endDate: {'>=': currentDate},
    };
    PMPeriod.findOne(query).then(function(active){
      res.json(active);
    }).catch(function(err){
      console.log(err);
      res.negotiate(err);
    });
  }

};

//Params must be Date objects
function overlapsRange(newStart, newEnd, currentPeriodId){
  var query = {
    endDate: {'>': newStart},
    startDate: {'<': newEnd},
  };
  if(currentPeriodId){
    query.id = {'!':currentPeriodId};
  }
  return PMPeriod.findOne(query).then(function(result){
    return result;
  }).catch(function(err){
    console.log(err);
  });
}
