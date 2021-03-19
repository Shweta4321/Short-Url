const mongoose = require('mongoose');

const shortUrlSchema = new mongoose.Schema({
  shortId: {
    type: String,
    required: true,
  },url: {
    type: String,
    required: true,
  }
})

const ShortUrl = mongoose.model('shortUrl', shortUrlSchema)

module.exports = ShortUrl
