const express = require('express');
const app = express();
const { cards, users } = require('./db');
const jwt = require('jsonwebtoken');
const { JWT_SECRET = 'neverTell'} = process.env;
const { requireUser } = require('./utils');

app.use(express.json());
app.use(express.urlencoded({extended:true}));

// POST /api/users/login (log in with password, get back jwt)
app.post('/users/login', async (req, res, next) => {
  const { username, password } = req.body;

  // request must have both
  if (!username || !password) {
    next({
      name: 'MissingCredentialsError',
      message: 'Please supply both a username and password'
    });
  }

  try {
    const user = users.find(user => user.username === username && user.password === password);
    if(!user) {
      next({
        name: 'IncorrectCredentialsError',
        message: 'Username or password is incorrect',
      })
    } else {
      const token = jwt.sign({id: user.id, username: user.username}, JWT_SECRET, { expiresIn: '1w' });
      res.send({ user, message: "you're logged in!", token });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
});

// set `req.user` if possible
app.use(async (req, res, next) => {
  const prefix = 'Bearer ';
  const auth = req.header('Authorization');
  
  if (!auth) { // nothing to see here
    next();
  } else if (auth.startsWith(prefix)) {
    const token = auth.slice(prefix.length);
    
    try {
      const parsedToken = jwt.verify(token, JWT_SECRET);
      
      const id = parsedToken && parsedToken.id
      if (id) {
        req.user = users.find(user => user.id === id);
        next();
      }
    } catch (error) {
      next(error);
    }
  } else {
    next({
      name: 'AuthorizationHeaderError',
      message: `Authorization token must start with ${ prefix }`
    });
  }
});

// protected endpoint, sends back user information, if authenticated via jwt
app.get('/users/me', requireUser, async (req, res, next) => {
  try {
    res.json(req.user);
  } catch (error) {
    console.error(error);
    next(error)
  }
});

// public endpoint, no auth
app.get('/cards', async (req, res, next) => {
  try {
    res.send(cards);
  } catch (error) {
    console.error(error);
    next(error)
  }
});

// error handling middleware
app.use((error, req, res, next) => {
  console.error('SERVER ERROR: ', error);
  if(res.statusCode < 400) res.status(500);
  res.send({error: error.message, name: error.name, message: error.message, table: error.table});
});

// we export the app, not listening in here, so that we can run tests
module.exports = app;
