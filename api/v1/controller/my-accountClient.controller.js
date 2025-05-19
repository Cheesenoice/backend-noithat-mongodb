const Account = require("../../../model/user.model");
const md5 = require("md5");
module.exports.myAccountClient = async (req, res) => {
  try {
    const token = req.cookies.token;
    const account = await Account.findOne({
      token: token,
      deleted: false,
    }).select("-token -passWord");
    res.json({
      code: 200,
      data: account,
    });
  } catch (error) {
    res.json({
      code: 404,
      message: "không thành công",
    });
  }
};

module.exports.edit = async (req, res) => {
  try {
    const token = req.cookies.token;

    // Kiểm tra nếu đã tồn tại email hoặc số điện thoại (trừ chính user đang sửa)
    const emailExist = await Account.findOne({
      token: { $ne: token },
      $or: [{ email: req.body.email }, { phoneNumber: req.body.phoneNumber }],
      deleted: false,
    });

    if (emailExist) {
      return res.json({
        code: 400,
        message: "Email hoặc số điện thoại đã tồn tại.",
      });
    }

    // Xử lý mật khẩu
    if (req.body.passWord && req.body.passWord.trim() !== "") {
      req.body.passWord = md5(req.body.passWord);
    } else {
      delete req.body.passWord; // Không cập nhật mật khẩu nếu không nhập mới
    }

    // Xử lý địa chỉ
    if (req.body.address && req.body.address.length > 0) {
      let defaultAddressIndex = -1;
      // Tìm xem có địa chỉ nào được đánh dấu là mặc định trong request không
      req.body.address.forEach((addr, index) => {
        if (addr.isDefault === true) {
          defaultAddressIndex = index;
        }
      });

      // Nếu không có địa chỉ nào được đánh dấu mặc định, đặt địa chỉ đầu tiên làm mặc định
      if (defaultAddressIndex === -1) {
        defaultAddressIndex = 0;
      }

      // Cập nhật lại mảng địa chỉ, đảm bảo chỉ có một địa chỉ mặc định
      req.body.address = req.body.address.map((addr, index) => ({
        ...addr,
        isDefault: index === defaultAddressIndex,
      }));
    }

    // Cập nhật tài khoản
    const result = await Account.updateOne({ token: token }, req.body);

    if (result.modifiedCount === 0) {
      return res.json({
        code: 400,
        message:
          "Không có thay đổi nào được thực hiện hoặc tài khoản không tồn tại.",
      });
    }

    const account = await Account.findOne({
      token: token,
      deleted: false,
    }).select("-passWord -token");

    res.json({
      data: account,
      code: 200,
      message: "Thay đổi thông tin tài khoản thành công.",
    });
  } catch (error) {
    console.error("Lỗi cập nhật tài khoản:", error);
    res.json({
      code: 500,
      message: "Đã xảy ra lỗi trong quá trình cập nhật tài khoản.",
    });
  }
};
