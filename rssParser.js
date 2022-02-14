const Parser = require('rss-parser');
let parser = new Parser();

let rssParser = {
  getFeed: async function (source) {
    try {
      let feed = await parser.parseURL(source);
      feed.src = source;

      return feed;
    } catch (err) {
      console.log(err);
      return '';
    }
  },
};

module.exports = rssParser;
