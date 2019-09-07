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
  res.send('Welcome to the PennApps XX API!');
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
      'Welcome to the PennApps XX API! All modules are currently functional.'
  });
});

/**
 * @route /api/v1/register
 * @description Allows user to register as a fully privileged user on the application.
 * @version 1.0.0
 */
app.post('/api/v1/register', async function(req, res) {
  console.log(req.query);
  if (!req.query.username || !req.query.password)
    return res.send('Must provide username and password!');

  console.log(
    `Creating account with username ${req.query.username} and password ${req.query.password}...`
  );

  let hashedPassword = await utils.hashPassword(req.query.password);
  let userToken = await firestoreDB.createUser(
    req.query.username,
    hashedPassword
  );

  if (!userToken) {
    return res.sendStatus(500);
  } else {
    utils.sendVerificationEmail(req.query.username, userToken);
    return res.send(
      'Thank you for registering for Food Sharing Service. Please check your email for an email from pennappsxx@gmail.com to verify your account.'
    );
  }
});

/**
 * @route /api/v1/login
 * @description Allows user to login to the application and allows app to begin full functionality.
 * @version 1.0.0
 */
app.post('/api/v1/login', function(req, res) {});

app.get('/api/v1/food/all', function(req, res) {});

app.get('/api/v1/food/available', function(req, res) {});

app.get('/api/v1/space/all', function(req, res) {});

app.get('/api/v1/space/available', function(req, res) {});

app.get('/api/v1/users/all', function(req, res) {});

app.get('/api/v1/users/active', function(req, res) {});

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
