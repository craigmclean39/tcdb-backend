const Podcast = require('../models/podcast');
const Episode = require('../models/episode');
const { body, validationResult } = require('express-validator');
const { stripHtml } = require('string-strip-html');
const async = require('async');
const { getFeed } = require('../rssParser');
const episodeFromFeed = require('../episodeFromFeed');

exports.podcast_list = function (req, res, next) {
  Podcast.count({}, (err, count) => {
    res.set('X-Total-Count', count);

    Podcast.find({}, 'title image url')
      .skip(req.query.offset)
      .limit(req.query.limit)
      .sort({ title: 1 })
      .exec((err, results) => {
        if (err) {
          return next(err);
        }

        if (results === null) {
          let error = new Error('No Podcasts Found');
          error.status = 404;
          return next(error);
        }
        res.json(results);
        next();
      });
  });
};

exports.episode_list = function (req, res, next) {
  Episode.find({})
    .skip(req.query.offset)
    .limit(req.query.limit)
    .sort({ pubDate: -1 })
    .populate('podcast')
    .exec((err, results) => {
      if (err) {
        return next(err);
      }

      if (results === null) {
        let error = new Error('No Episodes Found');
        error.status = 404;
        return next(error);
      }
      res.json(results);
      next();
    });
};

exports.podcast_detail = function (req, res, next) {
  //Exclude the episode info
  Podcast.findById(req.params.id).exec((err, results) => {
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
  //To make sure the podcast info is removed from elasticsearch
  //we need to call remove on the document itself, thus I'm calling
  //findById and then calling remove on the results as opposed to
  //findByIdAndDelete which doesn't properly remove from elasticsearch
  Podcast.findById(req.params.id, function (err, podcast) {
    if (err) {
      return next(err);
    }

    if (!podcast) {
      return res.status(404).send({
        message: 'Podcast not found',
      });
    }

    if (podcast.episodes) {
      async.each(
        podcast.episodes,
        (episode, next) => {
          Episode.findById(episode._id, function (err, ep) {
            if (err) {
              return next(err);
            }

            ep.remove((err) => {
              if (err) {
                console.log('**************Episode NOT Removed');
                next(err);
              }

              ep.on('es-removed', (err, res) => {
                if (err) {
                  console.log('**************Episode DOC NOT Removed');
                } else {
                  console.log('Episode DOC Removed');
                }
              });

              console.log('Episode Removed');
              next();
            });
          });
        },
        (err) => {
          console.log('Episodes Removed');

          podcast.remove((err) => {
            if (err) {
              console.log('**************Podcast NOT Removed');
              return res.status(404).send({
                message: 'Podcast not found',
              });
            }

            podcast.on('es-removed', (err, res) => {
              if (err) {
                console.log('**************Podcast DOC NOT Removed');
              } else {
                console.log('Podcast DOC Removed');
              }
            });

            console.log('Podcast Removed');
            res.status(200).json({ message: 'Podcast deleted.' });
          });
        }
      );
    }
  });
};

exports.podcast_episodes = function (req, res, next) {
  Episode.count({ podcast: req.params.id }, (err, count) => {
    console.log(count);
    res.set('X-Total-Count', count);

    Episode.find({ podcast: req.params.id })
      .skip(req.query.offset)
      .limit(req.query.limit)
      .sort({ pubDate: '-1' })
      .exec((err, results) => {
        if (err) {
          return next(err);
        }

        if (results === null) {
          let error = new Error('No Episodes Found');
          error.status = 404;
          return next(error);
        }
        res.json(results);
        next();
      });
  });
};

exports.podcast_episode_detail = function (req, res, next) {
  console.log(req.params);

  Episode.findById(req.params.id).exec((err, results) => {
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
  async (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(422).send({ message: 'Invalid RSS Feed' });
    }

    await AddSinglePodcastFromFeed(req.body.rss);
    res.status(200).json({ message: 'Podcast Added.' });
  },
];

exports.search = [
  body('search', 'Error').trim().isLength({ min: 1 }).escape(),
  (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log(errors.array());
      return res.status(422).send({ message: 'Invalid Search' });
    }

    //Search both Podcast and Episodes
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
              next(null, results);
              //res.status(200).json({ message: 'Search successful' });
            }
          );
        },
      ],
      function (err, results) {
        const hits = [];
        results.forEach((result) => {
          hits.push(...result.hits.hits);
        });

        hits.sort((a, b) => {
          if (a._score < b._score) return 1;
          if (a._score > b._score) return -1;
          return 0;
        });

        const returnJson = {
          hits: [],
        };

        hits.forEach((hit) => {
          console.log(hit);
          const hitJson = {
            type: hit._index,
            id: hit._id,
          };
          returnJson.hits.push(hitJson);
        });

        res.status(200).json(returnJson);
      }
    );
  },
];

const AddSinglePodcastFromFeed = async (rssUrl, error) => {
  let feed = undefined;
  try {
    feed = await getFeed(rssUrl);
  } catch (err) {
    console.log(err);
    return;
  }

  console.log('Feed Added: ' + rssUrl);

  let podcast;
  try {
    podcast = await Podcast.findOne({ source: feed.src }, 'title').exec();
    if (!podcast) {
      console.log('Podcast not found');
    } else {
      console.log('Podcast found');
      return;
    }
  } catch (err) {
    return;
  }

  //Pod not found
  let imageDetail = {
    link: feed.image.link ? feed.image.link : '',
    url: feed.image.url ? feed.image.url : '',
    title: feed.image.title ? feed.image.title : '',
  };

  let podcastDetail = {
    title: feed.title ? feed.title : 'TITLE',
    description: feed.description ? stripHtml(feed.description).result : '',
    image: imageDetail,
    link: feed.link ? feed.link : '',
    language: feed.language ? feed.language : '',
    copyright: feed.copyright ? feed.copyright : '',
    source: feed.src ? feed.src : '',
    episodes: [],
    dateUpdated: new Date(),
    author: feed.itunes ? (feed.itunes.author ? feed.itunes.author : '') : '',
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

  let podId;
  try {
    const pod = await Podcast.findOneAndUpdate(
      { source: podcastDetail.source },
      podcastDetail,
      { upsert: true, new: true }
    );

    console.log('Podcast Added to DB');
    console.log(pod._id);
    podId = pod._id;
  } catch (err) {
    console.log(err);
    return;
  }

  let episodeDetails = [];
  feed.items.forEach((episode) => {
    let detail = episodeFromFeed(episode, podId);
    episodeDetails.push(detail);
  });

  let episodeIds = [];
  await async.each(episodeDetails, (detail, callback) => {
    Episode.findOneAndUpdate(
      {
        guid: detail.guid,
      },
      detail,
      { upsert: true, new: true },
      (err, doc) => {
        if (err) {
          return;
        }

        episodeIds.push(doc._id);
        console.log('Episode Added');
        callback();
      }
    );
  });

  console.log('All Episodes Added');

  await Podcast.findOneAndUpdate(
    { source: podcastDetail.source },
    { episodes: episodeIds },
    { upsert: true, new: true }
  );

  console.log('Episode Ids Added to Podcast');
};

exports.populate = async (req, res, next) => {
  const sources = [
    'https://rss.art19.com/accused',
    'https://feeds.megaphone.fm/HSW9433683425',
    'https://rss.art19.com/alligator-candy',
    'https://podcasts.files.bbci.co.uk/p060ms2h.rss',
    'https://feeds.megaphone.fm/dead-and-gone',
    'https://yourownbackyard.libsyn.com/rss',
    'http://feeds.hubbardpodcasts.com/22HoursAnAmericanNightmare',
    'https://www.podcastone.com/podcast?categoryID2=2235',
    'https://www.podcastone.com/podcast?categoryID2=1119',
    'http://feeds.feedburner.com/CarollaReasonableDoubt',
    'http://www.podcastone.com/podcast?categoryID2=2208',
    'https://www.podcastone.com/podcast?categoryID2=1983',
    'http://www.podcastone.com/podcast?categoryID2=2197',
    'http://www.podcastone.com/podcast?categoryID2=2182',
    'http://www.podcastone.com/podcast?categoryID2=2219',
    'http://www.podcastone.com/podcast?categoryID2=2202',
    'http://www.podcastone.com/podcast?categoryID2=2243',
    'http://www.podcastone.com/podcast?categoryID2=1182',
    'https://www.omnycontent.com/d/playlist/fdc2ad13-d199-4e97-b2db-a59300cb6cc2/fe61751a-7d9f-429d-920b-ac4e00ff32f7/823d6d87-634d-41a7-91b7-ac4e01008254/podcast.rss',
    'https://feeds.megaphone.fm/88-days',
    'https://feeds.acast.com/public/shows/6f92de96-5610-47ac-aecc-3cc2cd75d735',
    'https://podcastfeeds.nbcnews.com/4ezcaoc8',
    'https://feeds.megaphone.fm/monster',
    'https://feeds.soundcloud.com/users/soundcloud:users:692523644/sounds.rss',
    'https://feeds.megaphone.fm/TNM8759446277',
    'https://feeds.megaphone.fm/amy-should-be-forty',
  ];

  await async.each(sources, AddSinglePodcastFromFeed);
  console.log('DONE');
  res.status(200).json({ message: 'Populate Success.' });
};
