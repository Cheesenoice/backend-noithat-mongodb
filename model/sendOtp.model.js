const mongoose = require("mongoose");
const forgotPasswordSchema = new mongoose.Schema({
    email: String,
    otp: String,
    expriceAt: {
        type: Date,
        exprice: 0
    }
}, { timestamps: true })

const forgotPassword = mongoose.model("forgotPassword", forgotPasswordSchema, "forgot-password")

module.exports = forgotPassword;