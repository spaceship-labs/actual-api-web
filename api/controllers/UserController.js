module.exports = {
  async send_password_recovery(req, res) {
    var form = req.params.all();
    const email = form.email || false;
    try {
      if (email && Common.validateEmail(email)) {
        const user = await UserWeb.findOne(
          { email: email },
          { select: ['id', 'password', 'email'] }
        );
        if (!user) {
          return res.negotiate(new Error('No se encontro el usuario'));
        }
        const result = await UserService.doPasswordRecovery(user, req);
        res.ok({ success: true });
      } else {
        return res.notFound();
      }
    } catch (e) {
      res.negotiate(e);
    }
  },

  findById: function(req, res) {
    var form = req.params.all();
    var id = form.id;
    var quickRead = form.quickRead;

    var userQuery = UserWeb.findOne({ id: id });

    if (!quickRead) {
      userQuery.populate('Stores');
    }

    userQuery
      .then(function(result) {
        res.ok({ data: result });
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  async update_password(req, res) {
    var form = req.params.all();
    var token = form.token || false;
    var email = form.email || false;
    var password = form.password || false;
    var confirmPass = form.confirm_pass || false;
    if (token && email && password && confirmPass && password == confirmPass) {
      const isValidToken = await UserService.validateRecoveryToken(token, email);
      if (isValidToken) {
        const user = await UserWeb.findOne({ email });
        await UserWeb.update({ email: email }).set(
          user.invited ? { new_password: password, invited: false } : { new_password: password }
        );
        return res.ok({ success: true });
      }
    }
    return res.negotiate(new Error('Información no valida'));
  },

  stores: function(req, res) {
    var form = req.allParams();
    var email = form.email;
    UserWeb.findOne({ email: email })
      .populate('Stores')
      .then(function(user) {
        var stores = (user && user.Stores) || [];
        return res.json(stores);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  register: function(req, res) {
    var form = req.allParams();
    UserWeb.create(form)
      .fetch()
      .then(function(_user) {
        return res.ok({ user: _user });
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  }
};
