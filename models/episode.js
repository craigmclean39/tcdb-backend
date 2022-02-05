let mongoose = require('mongoose');
let mongoosastic = require('mongoosastic');
let Schema = mongoose.Schema;

let EpisodeSchema = new Schema({
  title: { type: String, required: true, maxLength: 100, es_indexed: true },
  link: { type: String },
  content: { type: String, es_indexed: true },
  contentSnippet: { type: String },
  guid: { type: String },
  pubDate: { type: Date },
  isoDate: { type: Date },
  duration: { type: String },
  season: { type: Number },
});

EpisodeSchema.plugin(mongoosastic);

module.exports = mongoose.model('Episode', EpisodeSchema);
