module.exports.email = {
  service: 'mailgun',
  auth: {
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASSWORD
  },
  from: 'sergiocan@spaceshiplabs.com',
  testMode: false
};
