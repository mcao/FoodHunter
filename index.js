// Import and instantiate modules required for webserver
const express = require('express'),
  app = express(),
  http = require('http'),
  https = require('https');
const fs = require('fs');

// Imports configuration details
const config = require('./config.json');

// Configures various options related to the webserver
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Imports various utilitarian functions
const utils = require('./utils.js');

// Imports and instantiates Firebase Firestore utilities
const firestore_utils = require('./firestore-utilities.js');
const firestoreDB = firestore_utils.dbutilities;

/**
 * @route /
 * @description Base route of the application; provides only basic functionality.
 * @version 1.0.0
 */
app.get('/', function(req, res) {
  res.send('Welcome to the Food Hunter API!');
});

/**
 * @route /verify/<token>
 * @description Allows users to verify their email and allow themselves full functionality.
 * @version 1.0.0
 */
app.get('/verify/:user.:token', async function(req, res) {
  let verified = await firestoreDB.verify(req.params.user, req.params.token);
  res.send(verified);
});

/**
 * @route /verify/<token>
 * @description Allows users to verify their email and allow themselves full functionality.
 * @version 1.0.0
 */
app.get('/verifyphone/:user.:phone.:token', async function(req, res) {
  let verified = await firestoreDB.verifyPhone(
    req.params.user,
    req.params.phone,
    req.params.token
  );
  res.send(verified);
});

/**
 * @route /api/v1/status
 * @description Checks status of the API and ensures all services are running.
 * @version 1.0.0
 */
app.get('/api/v1/status', function(req, res) {
  res.send({
    status: 200,
    response:
      'Welcome to the Food Hunter API! All modules are currently functional.'
  });
});

/**
 * @route /api/v1/register
 * @description Allows user to register as a fully privileged user on the application.
 * @version 1.0.0
 */
app.post('/api/v1/register', async function(req, res) {
  if (!req.query.username || !req.query.password)
    return res.send('Must provide username and password!');

  console.log(
    `Creating account with username ${req.query.username}, password ${req.query.password}, and phone ${req.query.phoneNumber}...`
  );

  let hashedPassword = await utils.hashPassword(req.query.password);
  let result = await firestoreDB.createUser(
    req.query.username,
    hashedPassword,
    req.query.phoneNumber ? req.query.phoneNumber : ''
  );

  await utils.sendVerificationEmail(req.query.username, result.token);

  if (req.query.phoneNumber) {
    utils.sendVerificationText(
      req.query.username,
      req.query.phoneNumber,
      result.phoneToken
    );
  }

  res.send(result);
});

/**
 * @route /api/v1/login
 * @description Allows user to login to the application and allows app to begin full functionality.
 * @version 1.0.0
 */
app.post('/api/v1/login', async function(req, res) {
  if (!req.query.username || !req.query.password)
    return res.send('Must provide username and password!');

  let results = await firestoreDB.login(req.query.username, req.query.password);

  return results;
});

/**
 * @route /api/v1/logout
 * @description Allows user to securely log out of the application and end their session.
 * @version 1.0.0
 */
app.post('/api/v1/logout', async function(req, res) {
  if (!req.query.username || !req.query.token)
    return res.send('Must provide username and session token!');

  let loggedout = await firestoreDB.logout(req.query.username, req.query.token);

  return loggedout;
});

app.get('/api/v1/food/all', function(req, res) {
  res.send(firestoreDB.getDonations());
});

// TODO
app.get('/api/v1/food/available', function(req, res) {});

app.get('/api/v1/food/assign', function(req, res) {
  if (
    !req.query.username ||
    !req.query.token ||
    !req.query.donation_id ||
    !req.query.space_id
  )
    res.send({
      status: 500,
      response: 'You are missing one or more arguments.'
    });
  res.send(
    firestoreDB.assignDonationToSpace(
      req.query.username,
      req.query.token,
      req.query.donation_id,
      req.query.space_id
    )
  );
});

// TODO
app.get('/api/v1/food/new', function(req, res) {});

app.get('/api/v1/space/all', function(req, res) {
  res.send(firestoreDB.getSpaces());
});

// TODO
app.get('/api/v1/space/available', function(req, res) {});

// TODO
app.get('/api/v1/space/new', function(req, res) {});

app.get('/api/v1/user/:user/donations', function(req, res) {
  req.send(firestoreDB.getOneUsersDonations(req.params.user));
});

app.get('/api/v1/user/:user/spaces', function(req, res) {
  req.send(firestoreDB.getOneUsersDonations(req.params.user));
});

app.get('/api/v1/users/all', function(req, res) {
  res.send(firestoreDB.getUsers());
});

// TODO
app.get('/api/v1/users/active', function(req, res) {});

app.get(
  '/.well-known/acme-challenge/Y0xw5CLJv7Z7C0nsuOnE6KA85afl0aQvVR0LU4EEB0E',
  function(req, res) {
    res.send(
      'Y0xw5CLJv7Z7C0nsuOnE6KA85afl0aQvVR0LU4EEB0E.7Trlt0QtKsTKEIxHFe2ICSfIj2kqXdKCUGXWQdWF_es'
    );
  }
);

// Create HTTP and HTTPS servers
http.createServer(app).listen(config.http_port);
https
  .createServer(
    {
      key: fs.readFileSync('testing.key'),
      cert: fs.readFileSync('testing.cert')
    },
    app
  )
  .listen(config.https_port);

// Indicate that script is functional and fully started up
console.log(`Listening on ports ${config.http_port} and ${config.https_port}`);
