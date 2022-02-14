const Podcast = require('./models/podcast');
const Episode = require('./models/episode');
const async = require('async');
const rssParser = require('./rssParser.js');
const episodeFromFeed = require('./episodeFromFeed.js');

const update = async function (podcast) {
  const feed = await rssParser.getFeed(podcast.source);

  feed.items.forEach((episode) => {
    Episode.findOne({ guid: episode.guid }).exec((err, res) => {
      if (res) {
        //console.log('Episode Found');
      } else {
        console.log('------------Episode not found');

        let episodeDetail = episodeFromFeed(episode, podcast._id);

        Episode.findOneAndUpdate(
          {
            guid: episodeDetail.guid,
          },
          episodeDetail,
          { upsert: true, new: true },
          (err, doc) => {
            if (err) {
              return;
            }
          }
        );
      }
    });
  });
};

let updateAllPodcasts = async function () {
  console.log('update all podcasts');
  try {
    const results = await Podcast.find({});
    await async.each(results, update);
  } catch (err) {
    console.log(err);
    return;
  }

  console.log('All updated');
  return;
};

module.exports = updateAllPodcasts;
