// day la noi chua cac model de goi database ra
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    title: String,
    product_category_id: {
        type: String,
        default:''
    },
    description: String,
    color: String,
    price: Number,
    priceNew: Number,
    stock: Number,
    discountPercentage: Number,
    thumbnail: String,
    status: String,
    featured:String,
    position: Number,
    createBy: {
        account_id: String,
        createAt: {
            type: Date,
            default: Date
        }
    },
    deleted: {
        type: Boolean,
        default: false
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
},
    { timestamps: true }
)

//* default chỉ dùng được khi tạo mới một gì đó và không tạo được khi xóa  */


const Product = mongoose.model("Product", productSchema, "product")

module.exports = Product;