const express = require('express'),
  app = express(),
  http = require('http'),
  https = require('https');
const fs = require('fs');

const config = require('./config.json');

let options = {
  key: fs.readFileSync('testing.key'),
  cert: fs.readFileSync('testing.cert')
};

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
app.post('/api/v1/register', function(req, res) {});

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
https.createServer(options, app).listen(config.https_port);

// Indicate that script is functional and started up
console.log(`Listening on ports ${config.http_port} and ${config.https_port}`);
