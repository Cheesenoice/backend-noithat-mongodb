const Pay = require("../../../model/pay.model");
const Order = require("../../../model/oder.model");
const Cart = require("../../../model/cart.model");
const Product = require("../../../model/product.model");
const productHelper = require("../../../helper/product.priceNew");
const { paymomo } = require("./paymomo.controller");
const Account = require("../../../model/user.model"); // Fix the import path and typo

module.exports.checkout = async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res
        .status(401)
        .json({ status: "error", message: "User not logged in" });
    }
    const user = await Account.findOne({ token: token, deleted: false });
    if (!user) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid token" });
    }
    const userId = user._id;

    // Find active cart for user
    const cart = await Cart.findOne({ userId: userId, status: "active" });

    if (!cart || cart.product.length === 0) {
      return res
        .status(404)
        .json({ status: "error", message: "Cart is empty or not found" });
    }

    let totalPrice = 0;
    const detailedItems = [];

    for (const item of cart.product) {
      const productInfor = await Product.findOne({ _id: item.product_id });

      if (!productInfor) continue;

      const priceNew = productHelper.productPriceNew(productInfor);
      const itemTotalPrice = item.quantity * priceNew;
      totalPrice += itemTotalPrice;

      detailedItems.push({
        product_id: productInfor._id,
        name: productInfor.title,
        description: productInfor.description,
        image: productInfor.thumbnail,
        category: productInfor.category,
        stock: productInfor.stock,
        rating: productInfor.rating,
        discountPercentage: productInfor.discountPercentage,
        price: productInfor.price,
        priceNew,
        quantity: item.quantity,
        totalPrice: itemTotalPrice,
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        cartId: cart._id,
        items: detailedItems,
        totalPrice,
      },
    });
  } catch (error) {
    console.error("Checkout API Error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

module.exports.order = async (req, res) => {
  try {
    const token = req.cookies.token;
    const { name, email, address, phone, paymentMethod } = req.body;

    if (!token || !name || !email || !address || !phone || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin bắt buộc: name, email, address, phone, hoặc paymentMethod",
      });
    }

    if (!["momo", "cod"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message:
          "Phương thức thanh toán không hợp lệ. Chỉ hỗ trợ 'momo' hoặc 'cod'",
      });
    }

    // Find user by token
    const user = await Account.findOne({ token: token, deleted: false });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    const userId = user._id;

    // Find active cart for user
    const cart = await Cart.findOne({ userId: userId, status: "active" });

    if (!cart || !cart.product.length) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng không tồn tại hoặc trống",
      });
    }

    const products = [];
    for (const product of cart.product) {
      const productInfor = await Product.findOne({ _id: product.product_id });
      if (!productInfor) continue;
      products.push({
        product_id: product.product_id,
        price: productInfor.price,
        discountPercentage: productInfor.discountPercentage,
        quantity: product.quantity,
      });
    }

    // Calculate total amount
    const amount = Math.round(
      products.reduce((total, item) => {
        const priceAfterDiscount =
          item.price * (1 - item.discountPercentage / 100);
        return total + priceAfterDiscount * item.quantity;
      }, 0)
    );

    if (amount < 1000 || amount > 50000000) {
      return res.status(400).json({
        success: false,
        message: "Số tiền không hợp lệ: phải từ 1000 VND đến 50,000,000 VND",
      });
    }

    const newOrder = new Order({
      cartId: cart._id,
      userId: cart.userId,
      user_infor: { name, email, address, phone },
      product: products,
      paymentMethod,
      paymentStatus: "pending",
    });

    await newOrder.save();

    // Lưu giao dịch vào collection pay
    const newPay = new Pay({
      orderId: newOrder._id,
      paymentMethod,
      amount,
      status: "pending",
    });
    await newPay.save();

    // Xóa giỏ hàng
    await Cart.updateOne({ _id: cart._id }, { product: [] });

    if (paymentMethod === "cod") {
      return res.status(201).json({
        success: true,
        message: "Đặt hàng COD thành công",
        orderId: newOrder._id,
      });
    }

    // Nếu là MoMo, tạo thanh toán
    try {
      const payUrl = await paymomo(newOrder._id, amount.toString());
      return res.status(201).json({
        success: true,
        message: "Đơn hàng đã được tạo, chuyển hướng đến thanh toán MoMo",
        orderId: newOrder._id,
        payUrl,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: `Lỗi khi tạo thanh toán MoMo: ${error.message}`,
        orderId: newOrder._id,
      });
    }
  } catch (error) {
    console.error("Order API Error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server khi đặt hàng" });
  }
};

module.exports.getOrderDetails = async (req, res) => {
  try {
    const orderId = req.params.id;

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Thiếu orderId" });
    }

    const order = await Order.findOne({ _id: orderId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn đặt hàng" });
    }

    const detailedProducts = [];

    for (const item of order.product) {
      const productInfo = await Product.findOne({ _id: item.product_id });

      if (!productInfo) continue;

      const priceNew = productHelper.productPriceNew(productInfo);

      detailedProducts.push({
        product_id: productInfo._id,
        name: productInfo.title,
        image: productInfo.thumbnail,
        category: productInfo.category,
        description: productInfo.description,
        price: productInfo.price,
        priceNew,
        discountPercentage: productInfo.discountPercentage,
        quantity: item.quantity,
        totalPrice: priceNew * item.quantity,
      });
    }

    res.status(200).json({
      success: true,
      message: "Lấy chi tiết đơn đặt hàng thành công",
      data: {
        orderId: order._id,
        userInfor: order.user_infor,
        products: detailedProducts,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      },
    });
  } catch (error) {
    console.error("Get Order Details API Error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết đơn đặt hàng",
    });
  }
};
