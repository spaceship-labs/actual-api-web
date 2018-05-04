/**
 * FeaturedProductController
 *
 * @description :: Server-side logic for managing Featuredproducts
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
  async index(req, res) {
    try {
      const site = req.param('site');
      const featuredProducts = await FeaturedProduct.find({ site }).populate(
        'product'
      );
      res.ok(featuredProducts);
    } catch (err) {
      res.negotiate(err);
    }
  }
};
