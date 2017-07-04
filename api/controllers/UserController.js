/**
 * UserController
 *
 * @description :: Server-side logic for managing Users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var bcrypt = require('bcrypt');

module.exports = {

  send_password_recovery: function(req, res){
    var form  = req.params.all();
    var email = form.email || false;
    var store = req.activeStore || {};

    if(email && Common.validateEmail(email) ){
      UserWeb.findOne( {email:email}, {select: ['id', 'password', 'email']} )
        .then(function(user){
          var values = user.id + user.email + user.password;
          var tokenAux = bcrypt.hashSync(values ,bcrypt.genSaltSync(10));
          var token = tokenAux;
          //var token = tokenAux.replace(/\//g, "-");
          var storeUrl = store.url_sandbox;
          if(process.env.MODE === 'production'){
            storeUrl = store.url;
          }

          var frontendURL =  storeUrl || 'http://actualstudio.com';

          var recoverURL =  frontendURL + '/reset-password?';
          recoverURL += 'token='+token;
          recoverURL += '&email='+email;
          Email.sendPasswordRecovery(
            user.firstName,
            user.email,
            recoverURL,
            function(err) {
              if (err){return res.negotiate(err);}
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

  findById: function(req, res){
    var form = req.params.all();
    var id = form.id;
    var quickRead = form.quickRead;
    
    var userQuery =  UserWeb.findOne({id: id})

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


  update_password: function(req, res){
    var form = req.params.all();
    var token = form.token || false;
    var email = form.email || false;
    var password = form.password || false;
    var confirmPass = form.confirm_pass || false;
    if(token && email && password && confirmPass){
      if(password == confirmPass){
        validateToken(token, email, function(err, result){
          UserWeb.update(
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

  stores: function(req, res) {
    var form  = req.allParams();
    var email = form.email;
    UserWeb.findOne({email: email})
      .populate('Stores')
      .then(function(user) {
        var stores = user && user.Stores || [];
        return res.json(stores);
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });      
  },

  register: function(req, res){
    var form = req.allParams();
    UserWeb.create(form)
      .then(function(_user){
        return res.ok({user: _user});
      })
      .catch(function(err){
        console.log(err);
        res.negotiate(err);
      });     
  },

};

function validateToken(token, email, cb){
  UserWeb.findOne(
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

