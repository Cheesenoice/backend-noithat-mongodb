const User = require("../../../model/user.model");
const randomString = require("../../../helper/randomString");
const md5 = require("md5");
const sendMail = require("../../../helper/sendMail.helper");
const ForgotPassword = require("../../../model/sendOtp.model");

module.exports.register = async (req, res) => {
  try {
    const { fullName, email, phoneNumber, passWord } = req.body;

    const [exisEmail, exisPhone] = await Promise.all([
      User.findOne({ email, deleted: false }),
      User.findOne({ phoneNumber, deleted: false }),
    ]);

    if (exisEmail) {
      return res.status(400).json({ code: 400, message: "Email đã tồn tại" });
    }

    if (exisPhone) {
      return res
        .status(400)
        .json({ code: 400, message: "Số điện thoại đã tồn tại" });
    }

    const count = await User.countDocuments({ deleted: false });
    const user = new User({
      fullName,
      email,
      phoneNumber,
      passWord: md5(passWord),
      token: randomString.generateRandomString(20),
      position: count + 1,
      status: "active",
    });

    await user.save();
    res.cookie("token", user.token);

    res.json({ code: 200, message: "Đăng ký tài khoản thành công" });
  } catch (error) {
    console.error("Lỗi đăng ký:", error);
    res
      .status(500)
      .json({ code: 500, message: "Đăng ký tài khoản không thành công" });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { email, passWord } = req.body;

    const user = await User.findOne({
      email,
      deleted: false,
      status: "active",
    });
    if (!user) {
      return res
        .status(404)
        .json({
          code: 404,
          message: "Email không tồn tại hoặc tài khoản bị khóa",
        });
    }

    if (user.passWord !== md5(passWord)) {
      return res
        .status(400)
        .json({ code: 400, message: "Mật khẩu không đúng" });
    }

    res.cookie("token", user.token);
    res.json({ code: 200, message: "Đăng nhập thành công", token: user.token });
  } catch (error) {
    console.error("Lỗi đăng nhập:", error);
    res.status(500).json({ code: 500, message: "Đăng nhập không thành công" });
  }
};

module.exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email, deleted: false });
    if (!user) {
      return res
        .status(404)
        .json({ code: 404, message: "Email không tồn tại" });
    }

    const otp = randomString.generateRandomNumber(6); // thường dùng 6 số
    const expireTime = 2 * 60 * 1000; // 2 phút

    await ForgotPassword.create({
      email,
      otp,
      ExpriceAt: Date.now() + expireTime,
    });

    const subject = "Mã OTP xác minh lấy lại mật khẩu";
    const html = `<p>Vui lòng không chia sẻ mã với bất kỳ ai. Mã OTP của bạn là: <b>${otp}</b>. Thời gian hết hạn: 2 phút.</p>`;

    sendMail.sendMail(email, subject, html);
    res.json({ code: 200, message: "OTP đã được gửi tới email của bạn" });
  } catch (error) {
    console.error("Lỗi gửi OTP:", error);
    res.status(500).json({ code: 500, message: "Không thể gửi OTP" });
  }
};

module.exports.sendOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const record = await ForgotPassword.findOne({ email, otp });
    if (!record || Date.now() > record.ExpriceAt) {
      return res
        .status(400)
        .json({ code: 400, message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
    }

    const user = await User.findOne({ email, deleted: false });
    if (!user) {
      return res
        .status(404)
        .json({ code: 404, message: "Người dùng không tồn tại" });
    }

    res.cookie("token", user.token);
    res.json({
      code: 200,
      message: "Xác thực OTP thành công",
      token: user.token,
    });
  } catch (error) {
    console.error("Lỗi xác thực OTP:", error);
    res.status(500).json({ code: 500, message: "Lỗi xác thực OTP" });
  }
};

module.exports.resetPassword = async (req, res) => {
  try {
    const { token, passWord } = req.body;

    const user = await User.findOne({ token, deleted: false });
    if (!user) {
      return res
        .status(404)
        .json({ code: 404, message: "Không tìm thấy người dùng" });
    }

    if (md5(passWord) === user.passWord) {
      return res
        .status(400)
        .json({
          code: 400,
          message: "Mật khẩu mới không được trùng với mật khẩu cũ",
        });
    }

    user.passWord = md5(passWord);
    await user.save();

    res.json({ code: 200, message: "Thay đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi reset mật khẩu:", error);
    res.status(500).json({ code: 500, message: "Thay đổi mật khẩu thất bại" });
  }
};

// Lấy danh sách người dùng
module.exports.list = async (req, res) => {
  try {
    const users = await User.find({ deleted: false }).select(
      "-token -passWord"
    );
    res.json({ code: 200, data: users });
  } catch (error) {
    console.error("Lỗi lấy danh sách người dùng:", error);
    res
      .status(500)
      .json({ code: 500, message: "Không thể lấy danh sách người dùng" });
  }
};
