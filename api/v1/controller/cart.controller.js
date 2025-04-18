const Account = require("../../../model/user.model");
const Cart = require("../../../model/cart.model");
const Product = require("../../../model/product.model");
const productHelper = require("../../../helper/product.priceNew");
module.exports.cart = async (req, res) => {
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

    if (!cart) {
      return res
        .status(404)
        .json({ status: "error", message: "Cart not found" });
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
        totalPrice: itemTotalPrice,
      });
    }

    res.json({
      status: "success",
      data: {
        cartId: cart._id,
        items: detailedItems,
        totalPrice,
      },
    });
  } catch (error) {
    console.error("Cart API Error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};

module.exports.addCart = async (req, res) => {
  try {
    const token = req.cookies.token;
    const productId = req.params.id;
    let quantity = parseInt(req.body.quantity) || 1;

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

    // Find or create active cart for user
    let cart = await Cart.findOne({ userId: userId, status: "active" });
    if (!cart) {
      cart = await Cart.create({
        userId: userId,
        status: "active",
        product: [],
      });
    }
    const cartId = cart._id;

    // Check if the product already exists in the cart
    const existingProduct = cart.product.find(
      (item) => item.product_id == productId
    );

    if (existingProduct) {
      const newQuantity = existingProduct.quantity + quantity;

      await Cart.updateOne(
        { _id: cartId, "product.product_id": productId },
        { $set: { "product.$.quantity": newQuantity } }
      );

      return res.json({
        status: "success",
        message: "Product quantity updated in cart",
        data: {
          product_id: productId,
          quantity: newQuantity,
        },
      });
    } else {
      const objectCart = {
        product_id: productId,
        quantity: quantity,
      };

      await Cart.updateOne({ _id: cartId }, { $push: { product: objectCart } });

      return res.json({
        status: "success",
        message: "Product added to cart",
        data: {
          product_id: productId,
          quantity: quantity,
        },
      });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
};

module.exports.deleteCart = async (req, res) => {
  try {
    const token = req.cookies.token;
    const productId = req.params.id;

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
    if (!cart) {
      return res
        .status(404)
        .json({ status: "error", message: "Cart not found" });
    }

    // Xóa sản phẩm ra khỏi giỏ hàng
    const result = await Cart.updateOne(
      { _id: cartId },
      { $pull: { product: { product_id: productId } } }
    );

    return res.json({
      status: "success",
      message: "Sản phẩm đã được xóa khỏi giỏ hàng",
      result: result,
    });
  } catch (error) {
    console.error("Delete Cart Error:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal server error" });
  }
};

module.exports.updateCart = async (req, res) => {
  try {
    const token = req.cookies.token;
    const productId = req.params.id;
    const quantity = parseInt(req.params.quantity);

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "User not logged in" });
    }
    const user = await Account.findOne({ token: token, deleted: false });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    const userId = user._id;

    // Find active cart for user
    const cart = await Cart.findOne({ userId: userId, status: "active" });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    // Check if the product already exists in the cart
    const existingProduct = cart.product.find(
      (item) => item.product_id == productId
    );

    if (existingProduct) {
      const newQuantity = existingProduct.quantity + quantity;

      await Cart.updateOne(
        { _id: cartId, "product.product_id": productId },
        { $set: { "product.$.quantity": newQuantity } }
      );

      return res.json({
        status: "success",
        message: "Product quantity updated in cart",
        data: {
          product_id: productId,
          quantity: newQuantity,
        },
      });
    } else {
      const objectCart = {
        product_id: productId,
        quantity: quantity,
      };

      await Cart.updateOne({ _id: cartId }, { $push: { product: objectCart } });

      return res.json({
        status: "success",
        message: "Product added to cart",
        data: {
          product_id: productId,
          quantity: quantity,
        },
      });
    }
  } catch (error) {
    console.error("Error adding to cart:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Internal Server Error" });
  }
};

// Checkout logic: set cart status to finished and create a new cart for the user
module.exports.checkoutCart = async (req, res) => {
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

    // Set current cart to finished
    await Cart.updateOne(
      { userId: userId, status: "active" },
      { $set: { status: "finished" } }
    );

    // Create new cart for user
    await Cart.create({
      userId: userId,
      status: "active",
      product: [],
    });

    res.json({
      status: "success",
      message: "Checkout successful, new cart created.",
    });
  } catch (error) {
    console.error("Checkout Cart Error:", error);
    res.status(500).json({ status: "error", message: "Internal server error" });
  }
};
