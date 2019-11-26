/**
 * QuotationRecordController
 *
 * @description :: Server-side logic for managing Quotationrecords
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  async index(req, res) {
    try {
      const id = req.param('id');
      const records = await QuotationRecord.find({ Quotation: id })
        .populate('User')
        .populate('files');
      res.ok(records);
    } catch (err) {
      res.negotiate(err);
    }
  },

  async create(req, res) {
    try {
      const id = req.param('id');
      const { eventType, dateTime, notes } = req.allParams();
      if (req.user.role !== 'admin')
        throw new Error({
          status: 400,
          message: 'Este usuario no es administrador'
        });
      const quotationRecord = await QuotationRecord.create({
        Quotation: id,
        User: req.user.id,
        eventType,
        dateTime,
        notes
      }).fetch();
      if (req._fileparser && req._fileparser.upstreams.length) {
        await quotationRecord.addFiles(req, {
          dir: 'records/gallery',
          profile: 'record',
          modelId: quotationRecord.id
        });
      }
      const record = await QuotationRecord.findOne({
        id: quotationRecord.id
      })
        .populate('User')
        .populate('files');
      res.created(record);
    } catch (err) {
      res.negotiate(err);
    }
  }
};
