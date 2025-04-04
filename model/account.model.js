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
    deletedAt: Date  // tọa thêm trường deletedAt: Date để có thể lấy được thời gian thay đổi trường trong database
},
    { timestamps: true }
)


const Acount = mongoose.model("Account", accountSchema, "account")

module.exports = Acount;