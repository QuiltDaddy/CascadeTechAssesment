'use strict';

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();

app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 8080;
// const API_KEY = process.env.API_KEY || 'Bearer key3n20dtxVGD4TgV';

let userList = [];
let eventLog = [];

app.get('/', function (req, res) {
  res.send(JSON.stringify({ Hello: 'Cascade Fintech RESTful API' })).status(200);
});

app.post('/newUser', function (req, res) {
  // Post a new user to the server

  // Ensure req is formatted correctly
  let error = false;
  const approvedKeys = ['email', 'password', 'phone'];
  Object.keys(req.body).forEach(key => {
    if (!approvedKeys.includes(key)) { error = true; }
  })
  if (Object.keys(req.body).length !== 3 || error) {
    res.send(JSON.stringify({ error: "Incorrect user format.  Exactly: 'email', 'password', 'phone' keys are needed." })).status(400);
    return;
  }

  // Test if valid email format
  error = !validateEmail(req.body.email);
  if (error) {
    res.send(JSON.stringify({ error: "Invalid email format." })).status(400);
    return;
  }

  // Test if valid password format
  error = !(typeof(req.body.password) === 'string' && req.body.password.length > 7);
  if (error) {
    res.send(JSON.stringify({ error: "Password must be string of at least 8 characters." })).status(400);
    return;
  }

  // Test if valid phone number format
  error = !validatePhoneNumber(req.body.phone);
  if (error) {
    res.send(JSON.stringify({ error: "Phone number must be 10 digits with no spaces or special characters." })).status(400);
    return;
  }

  // Ensure email is not taken
  const emailList = userList.map(user => { return user.email; })
  error = emailList.includes(req.body.email);
  if (error) {
    res.send(JSON.stringify({ error: "Email already assigned to a user." })).status(400);
    return;
  }

  // Post user to server and create event for event log
  userList.push(req.body);
  createEvent({ type: "USER ADDED", data: {user: req.body.email} });
  res.send(JSON.stringify({ 'User Status': "User Created." })).status(201);
});

app.get('/login', function (req, res) {
  // Log user into the server

  // Ensure req is formatted correctly
  let error = false;
  const approvedKeys = ['type', 'email', 'password'];
  Object.keys(req.body).forEach(key => {
    if (!approvedKeys.includes(key)) { error = true; }
  })
  if (Object.keys(req.body).length !== 3 || error) {
    res.send(JSON.stringify({ error: "Incorrect login format.  Exactly: 'type', 'email', 'password' keys are needed." })).status(400);
    return;
  }

  // Ensure type is LOGIN
  error = req.body.type !== 'LOGIN';
  if (error) {
    res.send(JSON.stringify({ error: "'type' must be 'LOGIN' to login." })).status(400);
    return;
  }

  // Ensure email belongs to a valid user
  const emailList = userList.map(user => { return user.email; })
  error = !emailList.includes(req.body.email);
  if (error) {
    createEvent({ type: "FAILED LOGIN", data: {user: req.body.email} })
    res.send(JSON.stringify({ error: "Incorrect email password combination." })).status(400);
    return;
  }

  // Ensure password is correct for user email
  const user = userList.find(user => user.email === req.body.email);
  error = user.password !== req.body.password;
  if (error) {
    createEvent({ type: "FAILED LOGIN", data: {user: req.body.email} })
    res.send(JSON.stringify({ error: "Incorrect email password combination." })).status(400);
    return;
  }

  createEvent({ type: "LOGIN", data: {user: req.body.email} })
  res.send(JSON.stringify({ 'Login status': "You are logged in." })).status(200);
});

app.get('/logs', function (req, res) {
  // Log user into the server

  // Assumed user authorized to access logs because of time

  // Ensure req is formatted correctly
  let error = false;
  const approvedKeys = ['email', 'password', 'type', 'filters'];
  Object.keys(req.body).forEach(key => {
    if (!approvedKeys.includes(key)) { error = true; }
  })
  if (Object.keys(req.body).length !== 4 || error) {
    res.send(JSON.stringify({ error: "Incorrect log request format.  Exactly: 'email', 'password', 'type', 'filters' keys are needed." })).status(400);
    return;
  }

  // Ensure email and password are valid
  const emailList = userList.map(user => { return user.email; })
  error = !emailList.includes(req.body.email);
  if (error) {
    createEvent({ type: "FAILED LOG REQUEST", data: {user: req.body.email} })
    res.send(JSON.stringify({ error: "Incorrect email password combination." })).status(400);
    return;
  }
  const user = userList.find(user => user.email === req.body.email);
  error = user.password !== req.body.password;
  if (error) {
    createEvent({ type: "FAILED LOG REQUEST", data: {user: req.body.email} })
    res.send(JSON.stringify({ error: "Incorrect email password combination." })).status(400);
    return;
  }

  // Ensure type of request is valid
  const approvedTypes = ['USER ADDED', 'LOGIN', 'FAILED LOGIN', 'LOG REQUEST', 'FAILED LOG REQUEST', 'SESSION TIMEOUT', 'all'];
  if (req.body.type !== 'all') {
    req.body.type.forEach(key => {
      if (!approvedTypes.includes(key)) { error = true; }
    })
  }
  if (error) {
    res.send(JSON.stringify({ error: "'type' must be a string 'all' or an array of any of: 'USER ADDED', 'LOGIN', 'FAILED LOGIN', 'LOG REQUEST', 'FAILED LOG REQUEST', 'SESSION TIMEOUT'." })).status(400);
    return;
  }

  // Ensure filters are valid
  const approvedFilters = ['user', 'createdRange'];
  Object.keys(req.body.filters).forEach(key => {
    if (!approvedFilters.includes(key)) {
      res.send(JSON.stringify({ error: "'filters' must include both: 'user', 'createdRange'." })).status(400);
      return;
    }
  })

  // Ensure user filter is valid
  if (!(emailList.includes(req.body.filters.user) || req.body.filters.user === 'all')) {
    res.send(JSON.stringify({ error: "'filters.user' must include a valid user email or 'all'." })).status(400);
    return;
  }

  // Ensure createdRange filter is valid
  let firstDate = 0;
  let secondDate = 0;
  if (req.body.filters.createdRange !== 'all') {
    const createdRange = req.body.filters.createdRange;
    firstDate = parseInt(createdRange.slice(0, 14), 10);
    secondDate = parseInt(createdRange.slice(-14), 10);
    error = createdRange.length !== 29 || secondDate < firstDate;

    // I should have done more validation here but I was short on time
  }
  if (error) {
    res.send(JSON.stringify({ error: "'filters.createdRange' must be 'all' or in the format 'YYYYMMDDHHMMSS-YYYYMMDDHHMMSS' with the first time being earlier." })).status(400);
    return;
  }

  // Filter logs by type
  let queryResponse = eventLog;
  if (req.body.type !== 'all') {
    queryResponse = queryResponse.filter(log => req.body.type.includes(log.type));
  }

  // Filter logs by additional filters
  if (req.body.filters.user !== 'all') {
    queryResponse = queryResponse.filter(log => log.data.user === req.body.filters.user);
  }
  if (req.body.filters.createdRange !== 'all') {
    queryResponse = queryResponse.filter(log => (log.created >= firstDate && log.created <= secondDate));
  }

  createEvent({
    type: "LOG REQUEST",
    data: {
      user: req.body.email,
      query: {
        type: req.body.type,
        filters: req.body.filters
      }
    }
  });
  res.send(JSON.stringify({ 'Logs': queryResponse })).status(200);
});

function validateEmail(email) {
  // Found this online, works pretty good on limited testing
  if (/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return true;
  } else {
    return false;
  }
}

function validatePhoneNumber(phone) {
  // Found this online, works pretty good on limited testing
  if (phone.match(/^\d{10}$/)) {
    return true;
  } else {
    return false;
  }
}

function createEvent(event) {
  eventLog.push({
    'type': event.type,
    'created': getCurrentTime(),
    'data': event.data
  })
  console.log(eventLog);
}

function getCurrentTime() {
  const today = new Date();
  const year = '' + today.getFullYear();
  const month = '' + (today.getMonth() + 1 < 10 ? '0' + (today.getMonth() + 1) : today.getMonth() + 1);
  const date = '' + (today.getDate() < 10 ? '0' + today.getDate() : today.getDate());
  const hours = '' + (today.getHours() < 10 ? '0' + today.getHours() : today.getHours());
  const minutes = '' + (today.getMinutes() < 10 ? '0' + today.getMinutes() : today.getMinutes());
  const seconds = '' + (today.getSeconds() < 10 ? '0' + today.getSeconds() : today.getSeconds());
  const time = year + month + date + hours + minutes + seconds;
  return time;
}

app.listen(PORT, function () {
 console.log('Server listening on port:', PORT);
});
