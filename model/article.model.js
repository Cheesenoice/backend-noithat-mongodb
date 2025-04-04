const mongoose = require('mongoose')

const articletSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: String,
  author: String,
  tags: String,
  status: String,
  featured: String,
  position: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  deleted: {
    type: Boolean,
    default:false
  }
})

const Article = mongoose.model('Article', articletSchema, "Article")

module.exports = Article;
