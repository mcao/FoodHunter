// Imports module for password hashing
const bcrypt = require('bcrypt');

exports.hashPassword = async function(password) {
  return await bcrypt.hash(password, 10);
};

exports.verifyPassword = async function(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
};

exports.sendVerificationEmail = async function(email, token) {};
