//Runs in bootstrap
//or '' if not setting
function replaceUrlImageSizes(url) {
  const regexDimensions = new RegExp('(\\d{3,4}[x]\\d{3,4})');
  const regexResult = url.match(regexDimensions);
  var matchDimensions;

  if (regexResult && regexResult.length > 0) {
    matchDimensions = regexResult[0];
    url = url.replace(matchDimensions, '');
    url += '?d=' + matchDimensions;
  }

  return url;
}

module.exports.getContainerLink = function(next) {
  if (next) {
    return next(null, process.env.AWS_CLOUDFRONT_URL);
  }
};

module.exports.middleware = function(req, res, next) {
  if (req.url.indexOf('/uploads/') !== 0 || !process.env.AWS_CLOUDFRONT_URL) {
    next();
  } else {
    var redirectUrl = replaceUrlImageSizes(req.url);
    console.log('redirectUrl', redirectUrl);
    res.redirect(301, process.env.AWS_CLOUDFRONT_URL + redirectUrl);
  }
};
