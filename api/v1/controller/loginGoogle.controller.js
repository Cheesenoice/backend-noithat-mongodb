const User = require("../../../model/user.model");
const stringRandomHelper = require("../../../helper/randomString");

module.exports.callback = (req, res) => {
  res.redirect("/api/v1/google/profile");
};

module.exports.profile = async (req, res) => {
  try {
    const user = req.user;

    let existingUser = await User.findOne({
      googleId: user.id,
      deleted: false,
    });

    const count = await User.countDocuments({ deleted: false });
    const newPosition = count + 1;

    if (!existingUser) {
      const newUser = new User({
        googleId: user.id,
        fullName: user.displayName || "Unknown",
        email:
          user.emails && user.emails[0]?.value
            ? user.emails[0].value
            : "no-email@example.com",
        avatar: user.photos && user.photos[0]?.value,
        token: stringRandomHelper.generateRandomString(20),
        status: "active",
        deleted: false,
        position: newPosition,
      });

      existingUser = await newUser.save();
    }

    const token = existingUser.token;

    // Gửi token trong cookie (có thể thêm tùy chọn bảo mật như httpOnly nếu cần)
    res.cookie("token", token, {
      httpOnly: false, // hoặc true nếu không cần JS frontend đọc cookie
      sameSite: "Lax",
    });

    // Redirect đến frontend
    return res.redirect("http://localhost:5173/");
  } catch (error) {
    console.error("❌ Lỗi khi xử lý thông tin Google:", error);
    res.status(500).json({
      code: 500,
      message: "Đã xảy ra lỗi khi xử lý thông tin Google",
      error: error.message,
    });
  }
};
