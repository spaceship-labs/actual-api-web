module.exports.email = {
  service: 'mailgun',
  auth:{
    user: process.env.MAILGUN_USER,
    pass: process.env.MAILGUN_PASSWORD
  },
  from: 'luisperez@spaceshiplabs.com',
  testMode: false
};
