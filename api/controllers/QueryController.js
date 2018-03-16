module.exports = {
  async getSitemap(req, res) {
    const { site } = req.allParams();
    const sitemap = await QueryService.buildSitemap(site);
    res.setHeader("Content-type", "text/xml");
    return res.send(sitemap);
  }
};
