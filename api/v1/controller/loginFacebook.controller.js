const User = require("../../../model/user.modle");
const randomStringHelper = require("../../../helper/randomString")
module.exports.callback = async (req, res) => {
    res.redirect("/api/v1/auth/facebook/profile");
}

module.exports.profile = async (req, res) => {
    try {
      const user = req.user;
  
      // Kiểm tra xem người dùng đã tồn tại trong cơ sở dữ liệu chưa
      let existingUser = await User.findOne({
        facebookId: user.id, // Sử dụng `id` từ Facebook để kiểm tra
        deleted: false,
      });
  
      if (!existingUser) {
        const newUser = new User({
            facebookId: user.id, // ID từ Facebook
            fullName: user.displayName || "Unknown", // Tên hiển thị từ Facebook
            email: user.emails && user.emails[0]?.value ? user.emails[0].value : "no-email@example.com", // Email mặc định nếu không có
            avatar: user.photos && user.photos[0]?.value, // Ảnh đại diện từ Facebook (nếu có)
            token: randomStringHelper.generateRandomString(20),
            status: "active", 
            deleted: false, 
        });
  
        // Lưu người dùng mới vào cơ sở dữ liệu
        existingUser = await newUser.save();
         const token = existingUser.token;
         res.cookie("token", token)
        return res.json({
          code: 201,
          message: "Người dùng mới đã được tạo và đăng nhập thành công",
          token: token
        });
      }
  
      // Nếu người dùng đã tồn tại, trả về thông tin
      res.json({
        code: 200,
        message: "Đăng nhập thành công",
        data: existingUser,
      });
    } catch (error) {
      console.error(" Lỗi khi xử lý thông tin Facebook:", error);
      res.status(500).json({
        code: 500,
        message: "Đã xảy ra lỗi khi xử lý thông tin Facebook",
        error: error.message,
      });
    }
  };