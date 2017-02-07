/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var bcrypt = require('bcrypt');

module.exports = {

  find: function(req, res){
    var form = req.params.all();
    var model = 'user';
    var extraParams = {
      searchFields: ['firstName','email'],
      populateFields: ['role', 'Seller']
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
    var quickRead = form.quickRead;
    
    var userQuery =  User.findOne({id: id})
      .populate('permissions')
      .populate('mainStore')
      .populate('role')
      .populate('Seller');

    if(!quickRead){
      userQuery.populate('Stores');
    }

    userQuery.then(function(result){
      res.ok({data:result});
    })
    .catch(function(err){
      console.log(err);
      res.negotiate(err);
    });      
  },

  create: function(req, res){
    var form = req.allParams();
    User.create(form)
      .then(function(_user){
        return res.ok({user: _user});
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });     
  },

  update: function(req, res) {
    var form = req.params.all();
    var id = form.id;
    delete form.password;
    User.update({id: id}, form)
      .then(function(user){
        return res.ok({
          user: user
        });
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  send_password_recovery: function(req, res){
    var form  = req.params.all();
    var email = form.email || false;
    if(email && Common.validateEmail(email) ){
      User.findOne( {email:email}, {select: ['id', 'password', 'email']} )
        .then(function(user){
          var values = user.id + user.email + user.password;
          var tokenAux = bcrypt.hashSync(values ,bcrypt.genSaltSync(10));
          var token = tokenAux;
          //var token = tokenAux.replace(/\//g, "-");

          var frontendURL =  process.env.baseURLFRONT || 'http://ventas.miactual.com';

          var recoverURL =  frontendURL + '/reset-password?';
          recoverURL += 'token='+token;
          recoverURL += '&email='+email;
          Email.sendPasswordRecovery(
            user.firstName,
            user.email,
            recoverURL,
            function(err) {
              if (err){return res.negotiate(err)};
              return res.ok({
                success:true,
              });
            }
          );
        })
        .catch(function(err){
          console.log(err);
          res.negotiate(err);
        });
    }
    else{
      return res.notFound();
    }
  },

  update_password: function(req, res){
    var form = req.params.all();
    var token = form.token || false;
    var email = form.email || false;
    var password = form.password || false;
    var confirmPass = form.confirm_pass || false;
    if(token && email && password && confirmPass){
      if(password == confirmPass){
        validateToken(token, email, function(err, result){
          User.update(
            {email: email},
            {new_password: password}
          ).then(function(user){
            return res.ok({success:true});
          })
          .catch(function(err){
            console.log(err);
            return res.ok({success:false});            
          });
        });
      }else{
        return res.ok({success:false});
      }
    }else{
      return res.ok({success:false});
    }
  },

  brokers: function(req, res) {
    var form  = req.params.all();
    var page  = form.page  || 1;
    var limit = form.limit || 10;
    Role
      .findOne({name: 'broker'})
      .populate('owner')
      .paginate({page: page, limit: limit})
      .then(function(role){
        return res.json(role.owner);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });
  },

  stores: function(req, res) {
    var form  = req.allParams();
    var email = form.email;
    User.findOne({email: email})
      .populate('Stores')
      .then(function(user) {
        var stores = user && user.Stores || [];
        return res.json(stores);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  }
};

function validateToken(token, email, cb){
  User.findOne(
    {email:email},
    {select: ['id', 'email', 'password']}
  ).then(function(user){
    var values = user.id + user.email + user.password;
    var realToken = values;
    bcrypt.compare(realToken, token, cb);
  })
  .catch(function(err){
    console.log(err);
    res.negotiate(err);
  });  
}

