const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    cartId: String,
    userId: { type: String }, // Add this line
    user_infor: {
      name: String,
      email: String,
      address: String,
      phone: String,
    },
    product: [
      {
        product_id: String,
        price: Number,
        discountPercentage: Number,
        quantity: Number,
      },
    ],
    paymentMethod: String,
    paymentStatus: String,
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema, "order");
module.exports = Order;
