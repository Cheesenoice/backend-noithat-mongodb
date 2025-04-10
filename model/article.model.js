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
  },
  createBy: {
    account_id: String,
    createAt: {
        type: Date,
        default: Date
    }
},
deletedBy: {
    account_id: String,  // tọa thêm trường deletedAt: Date để có thể lấy được thời gian thay đổi trường trong database
    deletedAt: Date
},
updatedBy: [
    {
      account_id: String,  // tọa thêm trường deletedAt: Date để có thể lấy được thời gian thay đổi trường trong database
      updateAt: Date
    }
]
})

const Article = mongoose.model('Article', articletSchema, "Article")

module.exports = Article;
