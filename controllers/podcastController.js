const Podcast = require('../models/podcast');
const { body, validationResult } = require('express-validator');

exports.podcast_list = function (req, res, next) {
  Podcast.find({}, 'title')
    .sort({ title: 1 })
    .exec((err, results) => {
      if (err) {
        return next(err);
      }
      console.log(results);
      res.json(results);
      next();
    });
};
