let mongoose = require('mongoose');
let mongoosastic = require('mongoosastic');
let Schema = mongoose.Schema;

let ImageSchema = new Schema({
  url: { type: String },
  title: { type: String },
});

let PodcastSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      maxLength: 100,
      es_indexed: true,
      es_boost: 2.0,
    },
    description: { type: String, es_indexed: true },
    image: { type: ImageSchema },
    link: { type: String },
    language: { type: String },
    copyright: { type: String },
    source: { type: String },
    author: { type: String, es_indexed: true },
    email: { type: String },
    ownerName: { type: String, es_indexed: true },
    /* episodes: {
      type: [EpisodeSchema],
      es_indexed: true,
    }, */

    episodes: [{ type: Schema.Types.ObjectId, ref: 'Episode' }],

    dateUpdated: { type: Date, required: true },
    categories: [{ type: String, es_indexed: true }],
  },
  { toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

PodcastSchema.virtual('url').get(function () {
  return `/podcast/${this._id}`;
});

PodcastSchema.plugin(mongoosastic);

module.exports = mongoose.model('Podcast', PodcastSchema);
