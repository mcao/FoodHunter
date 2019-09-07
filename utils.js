// Imports module for password hashing
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'pennappsxx@gmail.com',
    pass: 'Pennapps1010'
  }
});

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
    else console.log(info);
  });
};
