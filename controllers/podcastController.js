const Podcast = require('../models/podcast');
const Episode = require('../models/episode');
const Parser = require('rss-parser');
let parser = new Parser();
const { body, validationResult } = require('express-validator');
const { stripHtml } = require('string-strip-html');
const async = require('async');

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

exports.podcast_delete = function (req, res, next) {
  Podcast.findByIdAndDelete(req.params.id, function (err, results) {
    if (err) {
      return next(err);
    }

    if (!results) {
      return res.status(404).send({
        message: 'Podcast not found',
      });
    }

    res.status(200).json({ message: 'Podcast deleted.' });
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

exports.podcast_create_post = [
  body('rss', 'Invalid URL').trim().isURL(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(422).send({ message: 'Invalid RSS Feed' });
    }

    getFeed(req.body.rss, (error, feed) => {
      if (error) {
        return res.status(409).send({
          message: error.message,
        });
      }

      Podcast.findOne({ source: feed.src }, 'title', {}, (err, results) => {
        if (err) {
          console.log(err);
        }

        if (results) {
          return res.status(409).send({
            message: 'Podcast is already in database',
          });
        }

        let imageDetail = {
          link: feed.image.link ? feed.image.link : '',
          url: feed.image.url ? feed.image.url : '',
          title: feed.image.title ? feed.image.title : '',
        };

        let podcastDetail = {
          title: feed.title ? feed.title : 'TITLE',
          description: feed.description
            ? stripHtml(feed.description).result
            : '',
          image: imageDetail,
          link: feed.link ? feed.link : '',
          language: feed.language ? feed.language : '',
          copyright: feed.copyright ? feed.copyright : '',
          source: feed.src ? feed.src : '',
          episodes: [],
          dateUpdated: new Date(),
          author: feed.itunes
            ? feed.itunes.author
              ? feed.itunes.author
              : ''
            : '',
          email:
            feed.itunes && feed.itunes.owner
              ? feed.itunes.owner.email
                ? feed.itunes.owner.email
                : ''
              : '',
          ownerName:
            feed.itunes && feed.itunes.owner
              ? feed.itunes.owner.name
                ? feed.itunes.owner.name
                : ''
              : '',
          categories:
            feed.itunes && feed.itunes.categories ? feed.itunes.categories : [],
        };

        async.each(
          feed.items,
          (episode, next) => {
            console.log('--');

            let episodeDetail = {
              title: episode.title ? episode.title : 'EPISODE TITLE',
              link: episode.link ? episode.link : '',
              content: episode.content ? stripHtml(episode.content).result : '',
              contentSnippet: episode.contentSnippet
                ? episode.contentSnippet
                : '',
              guid: episode.guid,
              pubDate: episode.pubDate ? episode.pubDate : '',
              isoDate: episode.isoDate ? episode.isoDate : '',
              duration: episode.itunes
                ? episode.itunes.duration
                  ? episode.itunes.duration
                  : ''
                : '',
              season: episode.itunes
                ? episode.itunes.season
                  ? episode.itunes.season
                  : -1
                : -1,
            };

            Episode.findOneAndUpdate(
              {
                guid: episode.guid,
              },
              episodeDetail,
              { upsert: true, new: true },
              (err, ep) => {
                if (err) {
                  console.log(err);
                }
                if (ep) {
                  podcastDetail.episodes.push(ep._id);
                }

                next();
              }
            );
          },
          (err) => {
            console.log('Conmplete');
            Podcast.findOneAndUpdate(
              { source: podcastDetail.source },
              podcastDetail,
              { upsert: true, new: true },
              (err, pod) => {
                if (err) {
                  console.log(err);
                }

                res
                  .status(200)
                  .json({ message: 'Podcast added successfully.' });
              }
            );
          }
        );

        /*         feed.items.forEach((episode) => {
          let episodeDetail = {
            title: episode.title ? episode.title : 'EPISODE TITLE',
            link: episode.link ? episode.link : '',
            content: episode.content ? stripHtml(episode.content).result : '',
            contentSnippet: episode.contentSnippet
              ? episode.contentSnippet
              : '',
            guid: episode.guid,
            pubDate: episode.pubDate ? episode.pubDate : '',
            isoDate: episode.isoDate ? episode.isoDate : '',
            duration: episode.itunes
              ? episode.itunes.duration
                ? episode.itunes.duration
                : ''
              : '',
            season: episode.itunes
              ? episode.itunes.season
                ? episode.itunes.season
                : -1
              : -1,
          };

          Episode.findOneAndUpdate(
            {
              guid: episode.guid,
            },
            episodeDetail,
            { upsert: true, new: true },
            (err, ep) => {
              if (err) {
                console.log(err);
              }
              if (ep) {
                podcastDetail.episodes.push(ep._id);
              }
            }
          );

          //podcastDetail.episodes.push(episodeDetail);
        }); */
      });
    });
  },
];

const getFeed = async function (source, callback) {
  try {
    let feed = await parser.parseURL(source);
    feed.src = source;
    callback(null, feed);
  } catch (err) {
    callback(err, null);
  }
};

exports.search = [
  body('search', 'Error').trim().isLength({ min: 1 }).escape(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(422).send({ message: 'Invalid Search' });
    }

    console.log(req.body.search);

    async.parallel(
      [
        function (next) {
          Podcast.search(
            {
              query_string: {
                query: req.body.search,
              },
            },
            function (err, results) {
              console.log(results);
              next(null, results);
              //res.status(200).json({ message: 'Search successful' });
            }
          );
        },
        function (next) {
          Episode.search(
            {
              query_string: {
                query: req.body.search,
              },
            },
            function (err, results) {
              console.log(results);
              next(null, results);
              //res.status(200).json({ message: 'Search successful' });
            }
          );
        },
      ],
      function (err, results) {
        console.log(results);
        res.status(200).json({ message: 'Search successful' });
      }
    );
  },
];
