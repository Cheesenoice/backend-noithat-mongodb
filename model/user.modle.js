const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    fullName: String,
    facebookId: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    passWord: String,
    token: String,
    phoneNumber: String,
    avatar: String,
    roleId: String,
    status: String,
    position: Number,
    // Thông tin Firebase
    firebaseUid: {
        type: String,
        unique: true,
        sparse: true // Cho phép null và unique
    },
    firebaseProvider: {
        type: String,
        enum: ["google.com", "password", null]
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    lastLoginAt: Date,
    // Các trường cũ cho Google OAuth (có thể giữ lại để tương thích ngược)
    googleId: String,
    accessToken: String,
    refreshToken: String,
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date
}, {
    timestamps: true
});

const User = mongoose.model("User", userSchema, "user");

module.exports = User;