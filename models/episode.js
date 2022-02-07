let mongoose = require('mongoose');
let mongoosastic = require('mongoosastic');
let Schema = mongoose.Schema;

let EpisodeSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      maxLength: 100,
      es_indexed: true,
      es_boost: 1.5,
    },
    link: { type: String },
    content: { type: String, es_indexed: true },
    contentSnippet: { type: String },
    guid: { type: String },
    pubDate: { type: Date },
    isoDate: { type: Date },
    duration: { type: String },
    season: { type: Number },
    podcast: { type: Schema.Types.ObjectId, ref: 'Podcast' },
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

EpisodeSchema.virtual('url').get(function () {
  return `/episode/${this._id}`;
});

EpisodeSchema.plugin(mongoosastic);

module.exports = mongoose.model('Episode', EpisodeSchema);
