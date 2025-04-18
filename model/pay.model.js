const mongoose = require("mongoose");

const paySchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    paymentMethod: {
      type: String,
      enum: ["momo", "cod"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    requestId: {
      type: String,
    },
    transactionId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    momoResponse: {
      type: Object,
    },
  },
  { timestamps: true }
);

const Pay = mongoose.model("Pay", paySchema, "pay");

module.exports = Pay;
