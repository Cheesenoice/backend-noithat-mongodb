const ShippingFee = require("../../../model/shippingFee.model");

// Create a new shipping fee
exports.createShippingFee = async (req, res) => {
  try {
    const { range_from_km, range_to_km, base_fee, extra_fee_per_km, status } =
      req.body;

    // Validation
    if (!Number.isFinite(range_from_km) || range_from_km < 0) {
      return res.status(400).json({
        success: false,
        message: "range_from_km phải là số không âm",
      });
    }
    if (!Number.isFinite(range_to_km) || range_to_km < 0) {
      return res.status(400).json({
        success: false,
        message: "range_to_km phải là số không âm",
      });
    }
    if (range_to_km < range_from_km) {
      return res.status(400).json({
        success: false,
        message: "range_to_km phải lớn hơn hoặc bằng range_from_km",
      });
    }
    if (!Number.isFinite(base_fee) || base_fee < 0) {
      return res.status(400).json({
        success: false,
        message: "base_fee phải là số không âm",
      });
    }
    if (!Number.isFinite(extra_fee_per_km) || extra_fee_per_km < 0) {
      return res.status(400).json({
        success: false,
        message: "extra_fee_per_km phải là số không âm",
      });
    }
    if (status && !["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "status phải là 'active' hoặc 'inactive'",
      });
    }

    const newFee = new ShippingFee({
      range_from_km,
      range_to_km,
      base_fee,
      extra_fee_per_km,
      status: status || "active",
    });
    await newFee.save();
    res.status(201).json({ success: true, data: newFee });
  } catch (error) {
    console.error("Lỗi khi tạo phí vận chuyển:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tạo phí vận chuyển" });
  }
};

// Get all shipping fees
exports.getShippingFees = async (req, res) => {
  try {
    const fees = await ShippingFee.find().sort({ range_from_km: 1 }); // Sắp xếp theo range_from_km tăng dần
    res.status(200).json({ success: true, data: fees });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phí vận chuyển:", error.message);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách phí vận chuyển",
    });
  }
};

// Update a shipping fee
exports.updateShippingFee = async (req, res) => {
  try {
    const { id } = req.params;
    const { range_from_km, range_to_km, base_fee, extra_fee_per_km, status } =
      req.body;

    console.log("Dữ liệu nhận được:", {
      id,
      range_from_km,
      range_to_km,
      base_fee,
      extra_fee_per_km,
      status,
    });

    // Validation
    if (
      range_from_km !== undefined &&
      (!Number.isFinite(range_from_km) || range_from_km < 0)
    ) {
      console.log("Lỗi validation range_from_km:", range_from_km);
      return res.status(400).json({
        success: false,
        message: "range_from_km phải là số không âm",
      });
    }
    if (
      range_to_km !== undefined &&
      (!Number.isFinite(range_to_km) || range_to_km < 0)
    ) {
      console.log("Lỗi validation range_to_km:", range_to_km);
      return res.status(400).json({
        success: false,
        message: "range_to_km phải là số không âm",
      });
    }
    if (
      base_fee !== undefined &&
      (!Number.isFinite(base_fee) || base_fee < 0)
    ) {
      console.log("Lỗi validation base_fee:", base_fee);
      return res.status(400).json({
        success: false,
        message: "base_fee phải là số không âm",
      });
    }
    if (
      extra_fee_per_km !== undefined &&
      (!Number.isFinite(extra_fee_per_km) || extra_fee_per_km < 0)
    ) {
      console.log("Lỗi validation extra_fee_per_km:", extra_fee_per_km);
      return res.status(400).json({
        success: false,
        message: "extra_fee_per_km phải là số không âm",
      });
    }
    if (status && !["active", "inactive"].includes(status)) {
      console.log("Lỗi validation status:", status);
      return res.status(400).json({
        success: false,
        message: "status phải là 'active' hoặc 'inactive'",
      });
    }

    // Tìm document hiện tại
    const currentFee = await ShippingFee.findById(id);
    if (!currentFee) {
      console.log("Không tìm thấy document với id:", id);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phí vận chuyển",
      });
    }
    console.log("Document hiện tại:", currentFee);

    // Cập nhật các trường
    currentFee.range_from_km =
      range_from_km !== undefined ? range_from_km : currentFee.range_from_km;
    currentFee.range_to_km =
      range_to_km !== undefined ? range_to_km : currentFee.range_to_km;
    currentFee.base_fee =
      base_fee !== undefined ? base_fee : currentFee.base_fee;
    currentFee.extra_fee_per_km =
      extra_fee_per_km !== undefined
        ? extra_fee_per_km
        : currentFee.extra_fee_per_km;
    currentFee.status = status !== undefined ? status : currentFee.status;
    currentFee.updated_at = Date.now();

    // Kiểm tra validation thủ công
    if (currentFee.range_to_km < currentFee.range_from_km) {
      console.log("Lỗi validation thủ công: range_to_km < range_from_km", {
        range_to_km: currentFee.range_to_km,
        range_from_km: currentFee.range_from_km,
      });
      return res.status(400).json({
        success: false,
        message: "range_to_km phải lớn hơn hoặc bằng range_from_km",
      });
    }

    // Lưu document
    const updatedFee = await currentFee.save();
    console.log("Document sau khi cập nhật:", updatedFee);

    res.status(200).json({ success: true, data: updatedFee });
  } catch (error) {
    console.error("Lỗi khi cập nhật phí vận chuyển:", error);
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      console.log("Chi tiết lỗi validation:", validationErrors);
      return res.status(400).json({
        success: false,
        message: "Lỗi validation: " + validationErrors.join(", "),
      });
    }
    res
      .status(500)
      .json({
        success: false,
        message: "Lỗi server khi cập nhật phí vận chuyển",
      });
  }
};

// Delete a shipping fee
exports.deleteShippingFee = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFee = await ShippingFee.findByIdAndDelete(id);

    if (!deletedFee) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phí vận chuyển",
      });
    }

    res
      .status(200)
      .json({ success: true, message: "Đã xóa phí vận chuyển thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa phí vận chuyển:", error.message);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi xóa phí vận chuyển" });
  }
};
