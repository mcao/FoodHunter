// Imports module for password hashing
const bcrypt = require('bcrypt');

// Import module for emails
const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pennappsxx@gmail.com',
    pass: 'Pennapps1010'
  }
});

// Import module for texting
const config = require('./config.json');
const client = require('twilio')(config.twilio_sid, config.twilio_token);

exports.hashPassword = async function(password) {
  return await bcrypt.hash(password, 10);
};

exports.verifyPassword = async function(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
};

exports.sendVerificationEmail = async function(email, token) {
  let mailOptions = {
    from: 'pennappsxx@gmail.com',
    to: email,
    subject: 'PennApps XX Verification',
    html: `To verify your email, please go to http://localhost:8080/verify/${email}.${token}`
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if (err) console.log(err);
  });
};

exports.sendVerificationText = function(email, phone, token) {
  client.messages
    .create({
      body:
        'http://localhost:8080/verifyphone/' +
        email +
        '.' +
        phone +
        '.' +
        token,
      from: config.twilio_number,
      to: phone
    })
    .then(message => {});
  return null;
};
