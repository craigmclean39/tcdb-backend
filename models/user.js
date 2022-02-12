let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    maxLength: 100,
  },
  password: {
    type: String,
    required: true,
    maxLength: 64,
  },
});

module.exports = mongoose.model('User', UserSchema);
