const { stripHtml } = require('string-strip-html');

let episodeFromFeed = function (episode, podId) {
  let episodeDetail = {
    title: episode.title ? episode.title : 'EPISODE TITLE',
    link: episode.link ? episode.link : '',
    content: episode.content ? stripHtml(episode.content).result : '',
    contentSnippet: episode.contentSnippet ? episode.contentSnippet : '',
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
    podcast: podId,
    length: episode.enclosure
      ? episode.enclosure.length
        ? episode.enclosure.length
        : -1
      : -1,
    type: episode.enclosure
      ? episode.enclosure.type
        ? episode.enclosure.type
        : -1
      : -1,
    mediaUrl: episode.enclosure
      ? episode.enclosure.url
        ? episode.enclosure.url
        : -1
      : -1,
  };

  return episodeDetail;
};

module.exports = episodeFromFeed;
