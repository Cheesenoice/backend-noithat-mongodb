const moogose = require("mongoose");

const cartSchema = new moogose.Schema(
  {
    userId: { type: String }, // Changed from user_id to userId
    status: { type: String, default: "active" }, // New status field
    product: [
      {
        product_id: String,
        quantity: Number,
      },
    ],
  },
  { timestamps: true }
);

const Cart = moogose.model("Cart", cartSchema, "cart");

module.exports = Cart;
