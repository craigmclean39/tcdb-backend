let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let EpisodeSchema = new Schema({
  title: { type: String, required: true, maxLength: 100 },
  link: { type: String },
  content: { type: String },
  contentSnippet: { type: String },
  guid: { type: String },
  pubDate: { type: Date },
  isoDate: { type: Date },
});

let ImageSchema = new Schema({
  url: { type: String },
  title: { type: String },
});

let PodcastSchema = new Schema(
  {
    title: { type: String, required: true, maxLength: 100 },
    description: { type: String },
    image: { type: ImageSchema },
    link: { type: String },
    language: { type: String },
    copyright: { type: String },
    source: { type: String },
    episodes: [{ type: EpisodeSchema }],
    dateUpdated: { type: Date, required: true },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

PodcastSchema.virtual('url').get(function () {
  return `/podcast/${this._id}`;
});

module.exports = mongoose.model('Podcast', PodcastSchema);
