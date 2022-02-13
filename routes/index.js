var express = require('express');
var router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const bcrypt = require('bcryptjs');

/* GET home page. */
router.post('/login', function (req, res, next) {
  passport.authenticate('local', (err, user, info) => {
    if (!user) {
      const e = new Error(info.message);
      e.status = 404;
      e.message = info.message;
      next(e);
    }

    console.log(user);
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      res.end();
    });
  })(req, res, next);
});

router.post('/signup', function (req, res, next) {
  bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
    if (err) {
      return next(err);
    }

    const user = new User({
      username: req.body.username,
      password: hashedPassword,
    }).save((err) => {
      if (err) {
        return next(err);
      }

      res.end();
    });
  });
});

router.get('/logout', (req, res) => {
  req.logout();
  res.end();
});

module.exports = router;
