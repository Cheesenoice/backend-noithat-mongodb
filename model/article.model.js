const mongoose = require('mongoose')
const slug = require('mongoose-slug-updater');
mongoose.plugin(slug);
const articletSchema = new mongoose.Schema({
  title: { type: String, required: true },
  articleCategory: String,
  content: String,
  author: String,
  tags: String,
  status: String,
  featured: String,
  position: Number,
  slug: {           // tạo thêm trường slug để chúng ta có thể lưu trường slug trên url nhứ tên sản phẩm tên các mục bên trang client
    type: String,
    slug: "title", 
    unique: true // sử dụng unique để tránh tạo ra hai trường slug trùng nhau nó sẽ tự động random 1 id để không bị trùng lặp
  },
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
},  { timestamps: true })

const Article = mongoose.model('Article', articletSchema, "Article")

module.exports = Article;
