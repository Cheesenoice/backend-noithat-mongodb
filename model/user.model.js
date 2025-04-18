const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    fullName: String,
    facebookId: String,
    email: {
      type: String,
      required: true,
      unique: true,
    },
    passWord: String,
    token: String,
    phoneNumber: String,
    avatar: String,
    roleId: String,
    status: String,
    position: Number,
    // Các trường cũ cho Google OAuth (có thể giữ lại để tương thích ngược)
    googleId: String,

    deleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    updatedBy: [
      {
        account_id: String, // tọa thêm trường deletedAt: Date để có thể lấy được thời gian thay đổi trường trong database
        updateAt: Date,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema, "user");

module.exports = User;
