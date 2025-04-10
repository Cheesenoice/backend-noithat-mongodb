const mongoose = require("mongoose");
const randomString = require("../helper/randomString")
const accountSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    passWord: String,
    token: {
        type: String,
        default: randomString.generateRandomString(20)
    }, // id có thể public ra ngoài còn token thì không
    phoneNumber: String,
    avatar: String,
    roleId: String,
    status: String,
    position: Number,
    deleted: {
        type: Boolean,
        default: false
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
    ],
    deletedAt: Date  // tọa thêm trường deletedAt: Date để có thể lấy được thời gian thay đổi trường trong database
},
    { timestamps: true }
)


const Acount = mongoose.model("Account", accountSchema, "account")

module.exports = Acount;