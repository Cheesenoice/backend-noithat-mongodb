const User = require("../../../model/user.modle")
const stringRandomHelper = require("../../../helper/randomString")
module.exports.callback =  (req, res) => {
    res.redirect("/api/v1/google/profile");
}

module.exports.profile =  async (req, res)=>{
  try {
    const user = req.user;

    // Kiểm tra xem người dùng đã tồn tại trong cơ sở dữ liệu chưa
    let existingUser = await User.findOne({
      googleId: user.id, // Sử dụng `id` từ Google để kiểm tra
      deleted: false,
    });
    const count = await User.countDocuments({ deleted: false });
    const newPosition = count + 1;
    if (!existingUser) {
      // Tự động tăng position theo số lượng user hiện tại
      
      const newUser = new User({
        googleId: user.id, // ID từ Google
        fullName: user.displayName || "Unknown", // Tên hiển thị từ Google
        email: user.emails && user.emails[0]?.value ? user.emails[0].value : "no-email@example.com", // Email mặc định nếu không có
        avatar: user.photos && user.photos[0]?.value, // Ảnh đại diện từ Google (nếu có)
        token: stringRandomHelper.generateRandomString(20),
        status: "active", 
        deleted: false,
        position: newPosition 
      });

      // Lưu người dùng mới vào cơ sở dữ liệu
      existingUser = await newUser.save();
      const token = existingUser.token
      res.cookie('token', token)
      return res.json({
        code: 201,
        message: "Người dùng mới đã được tạo và đăng nhập thành công",
        token: token
      });
    }

    // Nếu người dùng đã tồn tại, trả về thông tin
    const token = existingUser.token
    res.cookie('token', token)
    res.json({
      code: 200,
      message: "Đăng nhập thành công",
      token: token
    });
  } catch (error) {
    console.error("❌ Lỗi khi xử lý thông tin Google:", error);
    res.status(500).json({
      code: 500,
      message: "Đã xảy ra lỗi khi xử lý thông tin Google",
      error: error.message,
    });
  }
}

