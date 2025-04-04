const mongoose = require("mongoose");

const producCategorytSchema = new mongoose.Schema({
    title: String,
    description: String,
    parent_id: {
        type: String,
        default: ""
    },
    thumbnail: String,
    status: String,
    position: Number,
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date  // tọa thêm trường deletedAt: Date để có thể lấy được thời gian thay đổi trường trong database
},
    { timestamps: true }
)


const ProductCategory = mongoose.model("Product-category", producCategorytSchema, "products-category")

module.exports = ProductCategory;