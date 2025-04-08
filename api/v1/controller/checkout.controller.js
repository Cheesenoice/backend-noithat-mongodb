const Order = require("../../../model/oder.model")
const Cart = require("../../../model/catrt.modle");
const Product = require("../../../model/product.model")
const productHelper = require("../../../helper/product.priceNew")

module.exports.checkout = async (req, res) => {
    try {
      const cartId = req.cookies.cartId;
  
      if (!cartId) {
        return res.status(400).json({ status: "error", message: "Cart ID not found in cookies" });
      }
  
      const cart = await Cart.findOne({ _id: cartId });
  
      if (!cart || cart.product.length === 0) {
        return res.status(404).json({ status: "error", message: "Cart is empty or not found" });
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
          totalPrice: itemTotalPrice
        });
      }
  
      res.status(200).json({
        status: "success",
        data: {
          cartId: cart._id,
          items: detailedItems,
          totalPrice
        }
      });
  
    } catch (error) {
      console.error("Checkout API Error:", error);
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  };
  

module.exports.order = async (req, res) => {
    try {
      const cartId = req.cookies.cartId;
      const userInfor = req.body;
  
      if (!cartId || !userInfor) {
        return res.status(400).json({ success: false, message: "Thiếu cartId hoặc thông tin người dùng" });
      }
  
      const cart = await Cart.findOne({ _id: cartId });
  
      if (!cart || !cart.product.length) {
        return res.status(404).json({ success: false, message: "Giỏ hàng không tồn tại hoặc trống" });
      }
  
      const products = [];
  
      for (const product of cart.product) {
        const productInfor = await Product.findOne({ _id: product.product_id });
  
        if (!productInfor) continue;
  
        products.push({
          product_id: product.product_id,
          price: productInfor.price,
          discountPercentage: productInfor.discountPercentage,
          quantity: product.quantity
        });
      }
  
      const newOrder = new Order({
        cartId: cartId,
        user_infor: userInfor,
        product: products
      });
  
      await newOrder.save();
  
      // Xóa giỏ hàng sau khi đặt đơn
      await Cart.updateOne({ _id: cartId }, { product: [] });
  
      res.status(201).json({
        success: true,
        message: "Đặt hàng thành công",
        orderId: newOrder._id
      });
  
    } catch (error) {
      console.error("Order API Error:", error);
      res.status(500).json({ success: false, message: "Lỗi server khi đặt hàng" });
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
        return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt hàng" });
      }
  
      // Gắn thông tin chi tiết cho từng sản phẩm
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
          totalPrice: priceNew * item.quantity
        });
      }
  
      res.status(200).json({
        success: true,
        message: "Lấy chi tiết đơn đặt hàng thành công",
        data: {
          orderId: order._id,
          userInfor: order.user_infor,
          products: detailedProducts,
          createdAt: order.createdAt,
        }
      });
  
    } catch (error) {
      console.error("Get Order Details API Error:", error);
      res.status(500).json({ success: false, message: "Lỗi server khi lấy chi tiết đơn đặt hàng" });
    }
  };
  