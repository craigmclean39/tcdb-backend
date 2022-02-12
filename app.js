const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const dotenv = require('dotenv');
dotenv.config();
const bcrypt = require('bcryptjs');

const indexRouter = require('./routes/index');
const apiRouter = require('./routes/api');

const User = require('./models/user');

const mongoose = require('mongoose');
const login = process.env.MONGODB_LOGIN;
const mongoDB = `mongodb+srv://${login}@sandbox.1gheh.mongodb.net/truecrimedb?retryWrites=true&w=majority`;
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const app = express();

const corsOptions = {
  exposedHeaders: 'X-Total-Count',
};

app.use(cors(corsOptions));
app.use(logger('dev'));

passport.use(
  new LocalStrategy((username, password, done) => {
    console.log('0');
    User.findOne({ username: username }, (err, user) => {
      if (err) {
        return done(err);
      }

      if (!user) {
        return done(null, false, { message: 'Incorrect username' });
      }

      bcrypt.compare(password, user.password, (err, res) => {
        if (res) {
          return done(null, user);
        } else {
          return done(null, false, { message: 'Incorrect password' });
        }
      });
    });
  })
);

passport.serializeUser(function (user, done) {
  console.log('serialize');
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  console.log('deserialize');
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

app.use(session({ secret: 'cats', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/api', apiRouter);

module.exports = app;
