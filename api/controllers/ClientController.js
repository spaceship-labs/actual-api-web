var _ = require('underscore');
var moment = require('moment');
var Promise = require('bluebird');
var ADDRESS_TYPE_S = 'S';
var ADDRESS_TYPE_B = 'B';

module.exports = {
  async find(req, res) {
    const form = req.allParams();
    const model = 'client';
    const extraParams = {
      searchFields: ['id', 'CardName', 'CardCode', 'firstName', 'lastName', 'E_Mail', 'phone'],
      filters: {
        UserWeb: { '!': null }
      }
    };

    try {
      const result = await Common.find(model, form, extraParams);
      res.ok(result);
    } catch (e) {
      res.negotiate(e);
    }
  },

  async findById(req, res) {
    try {
      const id = req.param('id');
      const client = await Client.findOne({ id });
      const Contacts = await ClientContact.find({ CardCode: client.CardCode });
      const query = {
        CardCode: client.CardCode,
        AdresType: ClientService.ADDRESS_TYPE
      };
      const fiscalAddress = await FiscalAddress.findOne({
        CardCode: client.CardCode,
        AdresType: ClientService.ADDRESS_TYPE
      });
      const response = {
        ...client,
        Contacts,
        FiscalAddress: fiscalAddress
      };
      res.ok(response);
    } catch (err) {
      res.negotiate(err);
    }
  },

  async register(req, res) {
    var form = req.allParams();
    try {
      const user = await UserWeb.findOne({ email: form.E_Mail });
      const clientContact = await ClientContact.findOne({
        E_Mail: form.E_Mail
      });
      if (user && user.invited) {
        form.CardCode = user.CardCode;
        form.userId = user.id;
        form.invited = false;

        const { updatedClient, updatedUser } = await ClientService.updateClient(form, req);

        if (form.contacts && form.contacts.length > 0) {
          form.contacts[0].CntctCode = clientContact.CntctCode;
          form.contacts[0].CardCode = user.CardCode;
          await ContactService.updateContact(form.contacts[0]);
        }

        await UserWeb.update(
          { email: form.E_Mail },
          {
            new_password: form.password,
            invited: false
          }
        );
        return res.json({
          user: updatedUser,
          client: updatedClient
        });
      } else {
        var {
          createdClient,
          contactsCreated,
          fiscalAddressesCreated,
          createdUser
        } = await ClientService.createClient(form, req);

        if (contactsCreated && contactsCreated.length > 0) {
          sails.log.info('contacts created', contactsCreated);
          createdClient = Object.assign(createdClient, {
            Contacts: contactsCreated
          });
        }

        res.json({
          user: createdUser,
          client: createdClient
        });

        if (!form.invited) {
          Email.sendRegister(createdUser.firstName, createdUser.email, req.activeStore, function() {
            sails.log.info('Email de registro enviado', createdUser.email);
          });
        }
      }
    } catch (e) {
      return res.negotiate(e);
    }
  },

  async update(req, res) {
    var form = req.allParams();
    try {
      const { updatedClient, updatedUser } = await ClientService.updateClient(form, req);
      res.json({
        client: updatedClient,
        user: updatedUser
      });
    } catch (err) {
      console.log(err);
      res.negotiate(err);
    }
  },

  getContactsByClient: function(req, res) {
    var form = req.params.all();
    var cardCode = req.user.CardCode;

    ClientContact.find({ CardCode: cardCode })
      .sort({ createdAt: -1 })
      .then(function(contacts) {
        res.json(contacts);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  },

  async createContact(req, res) {
    var form = req.allParams();
    try {
      const createdContact = await ContactService.createContact(form, req);
      res.json(createdContact);
    } catch (err) {
      console.log('err', err);
      res.negotiate(err);
    }
  },

  async updateContact(req, res) {
    try {
      const form = req.allParams();
      const updatedContact = await ContactService.updateContact(form);
      res.ok(updatedContact);
    } catch (err) {
      res.negotiate(err);
    }
  },

  getFiscalAddressByClient: function(req, res) {
    var form = req.allParams();
    var CardCode = req.user.CardCode;
    var query = {
      CardCode: CardCode,
      AdresType: ClientService.ADDRESS_TYPE
    };

    var promises = [
      Client.findOne({ CardCode: CardCode, select: ['LicTradNum', 'cfdiUse'] }),
      FiscalAddress.findOne(query)
    ];

    Promise.all(promises)
      .then(function(results) {
        var client = results[0];
        var fiscalAddress = results[1];
        fiscalAddress.LicTradNum = client.LicTradNum;
        fiscalAddress.cfdiUse = client.cfdiUse;

        res.json(fiscalAddress);
      })
      .catch(function(err) {
        console.log('err', err);
        res.negotiate(err);
      });
  },

  async updateFiscalAddress(req, res) {
    var form = req.allParams();
    try {
      const updatedFiscalAddress = await FiscalAddressService.updateFiscalAddress(form, req);
      res.json(updatedFiscalAddress);
    } catch (err) {
      res.negotiate(err);
    }
  },

  getEwalletByClient: function(req, res) {
    var form = req.allParams();
    var id = form.id;
    Client.findOne({ id: id, select: ['ewallet'] })
      .then(function(client) {
        res.json(client.ewallet);
      })
      .catch(function(err) {
        console.log(err);
        res.negotiate(err);
      });
  }
};
