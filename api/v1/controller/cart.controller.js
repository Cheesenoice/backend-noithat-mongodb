const Cart = require("../../../model/catrt.modle");
const Product = require("../../../model/product.model")
const productHelper = require("../../../helper/product.priceNew")
module.exports.cart = async (req, res) => {
    try {
      const cartId = req.cookies.cartId;
  
      if (!cartId) {
        return res.status(400).json({ status: "error", message: "Cart ID not found in cookies" });
      }
  
      const cart = await Cart.findOne({ _id: cartId });
  
      if (!cart) {
        return res.status(404).json({ status: "error", message: "Cart not found" });
      }
  
      let totalPrice = 0;
      const detailedItems = [];
  
      for (const item of cart.product) {
        const productId = item.product_id;
        const productInfor = await Product.findOne({ _id: productId });
  
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
          priceNew: priceNew,
          quantity: item.quantity,
          totalPrice: itemTotalPrice
        });
      }
  
      res.json({
        status: "success",
        data: {
          cartId: cart._id,
          items: detailedItems,
          totalPrice
        }
      });
  
    } catch (error) {
      console.error("Cart API Error:", error);
      res.status(500).json({ status: "error", message: "Internal server error" });
    }
  };
  

  module.exports.addCart = async (req, res) => {
    try {
      const cartId = req.cookies.cartId;
      const productId = req.params.id;
      let quantity = parseInt(req.body.quantity) || 1;
  
      if (!cartId) {
        return res.status(400).json({ status: "error", message: "Cart ID is missing" });
      }
  
      // Tìm cart trong database
      const cart = await Cart.findOne({ _id: cartId });
  
      if (!cart) {
        return res.status(404).json({ status: "error", message: "Cart not found" });
      }
  
      // Kiểm tra sản phẩm đã có trong giỏ hàng chưa
      const existingProduct = cart.product.find(item => item.product_id == productId);
  
      if (existingProduct) {
        const newQuantity = existingProduct.quantity + quantity;
  
        // Cập nhật số lượng sản phẩm trong giỏ hàng
        await Cart.updateOne(
          { _id: cartId, "product.product_id": productId },
          { $set: { "product.$.quantity": newQuantity } }
        );
  
        return res.json({
          status: "success",
          message: "Product quantity updated in cart",
          data: {
            product_id: productId,
            quantity: newQuantity
          }
        });
  
      } else {
        // Thêm sản phẩm mới vào giỏ hàng
        const objectCart = {
          product_id: productId,
          quantity: quantity
        };
  
        await Cart.updateOne(
          { _id: cartId },
          { $push: { product: objectCart } }
        );
  
        return res.json({
          status: "success",
          message: "Product added to cart",
          data: {
            product_id: productId,
            quantity: quantity
          }
        });
      }
  
    } catch (error) {
      console.error("Error adding to cart:", error);
      return res.status(500).json({ status: "error", message: "Internal Server Error" });
    }
  };
  

  module.exports.deleteCart = async (req, res) => {
    try {
      const productId = req.params.id;
      const cartId = req.cookies.cartId;
  
      if (!cartId) {
        return res.status(400).json({ status: "error", message: "Cart ID is missing" });
      }
  
      // Xóa sản phẩm ra khỏi giỏ hàng
      const result = await Cart.updateOne(
        { _id: cartId },
        { $pull: { product: { product_id: productId } } }
      );
  
      return res.json({
        status: "success",
        message: "Sản phẩm đã được xóa khỏi giỏ hàng",
        result: result
      });
    } catch (error) {
      console.error("Delete Cart Error:", error);
      return res.status(500).json({ status: "error", message: "Internal server error" });
    }
  };
  
  module.exports.updateCart = async (req, res) => {
    try {
        const productId = req.params.id;
        const cartId = req.cookies.cartId;
        const quantity = parseInt(req.params.quantity);

        if (!cartId || !productId || isNaN(quantity)) {
            return res.status(400).json({ success: false, message: "Dữ liệu không hợp lệ" });
        }

        const result = await Cart.updateOne(
            { _id: cartId, "product.product_id": productId },
            { $set: { "product.$.quantity": quantity } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm trong giỏ hàng" });
        }

        res.status(200).json({ success: true, message: "Cập nhật số lượng sản phẩm thành công" });
    } catch (error) {
        console.error("Lỗi cập nhật giỏ hàng:", error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
};
