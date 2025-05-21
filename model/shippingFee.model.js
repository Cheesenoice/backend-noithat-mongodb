const mongoose = require("mongoose");

const shippingFeeSchema = new mongoose.Schema({
  range_from_km: {
    type: Number,
    required: true,
    min: 0,
  },
  range_to_km: {
    type: Number,
    required: true,
    min: [0, "range_to_km phải lớn hơn hoặc bằng 0"],
    validate: {
      validator: function (value) {
        return value >= this.range_from_km;
      },
      message: "range_to_km phải lớn hơn hoặc bằng range_from_km",
    },
  },
  base_fee: {
    type: Number,
    required: true,
    min: 0,
  },
  extra_fee_per_km: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ["active", "inactive"],
    default: "active",
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

// Đảm bảo không có khoảng cách trùng lặp
shippingFeeSchema.index({ range_from_km: 1, range_to_km: 1 }, { unique: true });

const ShippingFee = mongoose.model("ShippingFee", shippingFeeSchema);
module.exports = ShippingFee;
