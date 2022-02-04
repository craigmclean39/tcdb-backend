const Podcast = require('../models/podcast');
const { body, validationResult } = require('express-validator');

exports.podcast_list = function (req, res, next) {
  Podcast.find({}, 'title url')
    .sort({ title: 1 })
    .exec((err, results) => {
      if (err) {
        return next(err);
      }
      res.json(results);
      next();
    });
};

exports.podcast_detail = function (req, res, next) {
  //Exclude the episode info
  Podcast.findById(req.params.id, '-episodes').exec((err, results) => {
    if (err) {
      return next(err);
    }

    if (results === null) {
      let error = new Error('Podcast not found');
      error.status = 404;
      return next(error);
    }

    res.json(results);
    next();
  });
};

exports.podcast_episodes = function (req, res, next) {
  Podcast.findById(req.params.id, 'episodes').exec((err, results) => {
    if (err) {
      return next(err);
    }

    if (results === null) {
      let error = new Error('Podcast not found');
      error.status = 404;
      return next(error);
    }

    res.json(results);
    next();
  });
};

exports.podcast_episode_detail = function (req, res, next) {
  console.log(req.params);

  Podcast.findById(req.params.id)
    .select({ episodes: { $elemMatch: { id: req.params.episodeid } } })
    .exec((err, results) => {
      if (err) {
        return next(err);
      }

      if (results === null) {
        let error = new Error('Episode not found');
        error.status = 404;
        return next(error);
      }

      res.json(results);
    });
};
