const Order = require("../../../model/oder.model");
const Account = require("../../../model/user.model");

module.exports.myOrder = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "User not logged in" });
    }
    const user = await Account.findOne({ token: token, deleted: false });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    const userId = user._id;

    // Find all orders for this user
    const orders = await Order.find({ userId: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: "Lấy danh sách đơn hàng thành công",
      data: orders,
    });
  } catch (error) {
    console.error("MyOrder API Error:", error);
    res.status(500).json({ success: false, message: "Lỗi server khi lấy đơn hàng" });
  }
};