module.exports.email = {
  service: 'mailgun',
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASSWORD
  },
  from: 'yupit@spaceshiplabs.com',
  testMode: false
};
