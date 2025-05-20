const Product = require("../../../model/product.model");
const Order = require("../../../model/oder.model");
const User = require("../../../model/user.model");

// Tổng số lượng sản phẩm
exports.totalProducts = async (req, res) => {
  try {
    const count = await Product.countDocuments({ deleted: false });
    res.json({ totalProducts: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tổng số lượng người dùng
exports.totalUsers = async (req, res) => {
  try {
    const count = await User.countDocuments({ deleted: false });
    res.json({ totalUsers: count });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tổng doanh thu
exports.totalRevenue = async (req, res) => {
  try {
    const orders = await Order.find();
    let total = 0;
    orders.forEach((order) => {
      order.product.forEach((item) => {
        total +=
          (item.price - (item.price * (item.discountPercentage || 0)) / 100) *
          item.quantity;
      });
      total += order.shippingFee || 0;
    });
    res.json({ totalRevenue: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Sản phẩm bán chạy nhất (top 5)
exports.topProducts = async (req, res) => {
  try {
    const orders = await Order.find();
    const productMap = {};
    orders.forEach((order) => {
      order.product.forEach((item) => {
        if (!productMap[item.product_id]) productMap[item.product_id] = 0;
        productMap[item.product_id] += item.quantity;
      });
    });
    const top = Object.entries(productMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    const products = await Product.find({
      _id: { $in: top.map(([id]) => id) },
    });
    const result = products.map((p) => ({
      _id: p._id,
      title: p.title,
      sold: productMap[p._id.toString()] || 0,
      price: p.price,
      thumbnail: p.thumbnail,
    }));
    res.json({ topProducts: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Thống kê đơn hàng theo trạng thái
exports.orderStatusStats = async (req, res) => {
  try {
    const orders = await Order.find();
    const stats = {};
    orders.forEach((order) => {
      const lastStatus =
        order.orderStatus[order.orderStatus.length - 1]?.status || "unknown";
      stats[lastStatus] = (stats[lastStatus] || 0) + 1;
    });
    res.json({ orderStatusStats: stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Kiểm tra tồn kho từng sản phẩm
exports.inventoryStatus = async (req, res) => {
  try {
    const products = await Product.find({ deleted: false });
    const result = products.map((p) => ({
      _id: p._id,
      title: p.title,
      stock: p.stock,
      price: p.price,
      thumbnail: p.thumbnail,
    }));
    res.json({ inventoryStatus: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Thống kê số lượng sản phẩm sắp hết hàng (ví dụ: stock <= 5)
exports.lowStockProducts = async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const products = await Product.find({
      deleted: false,
      stock: { $lte: threshold },
    });
    res.json({ lowStockProducts: products });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Tổng giá trị hàng tồn kho
exports.totalInventoryValue = async (req, res) => {
  try {
    const products = await Product.find({ deleted: false });
    let totalValue = 0;
    products.forEach((p) => {
      totalValue +=
        (p.price - (p.price * (p.discountPercentage || 0)) / 100) *
        (p.stock || 0);
    });
    res.json({ totalInventoryValue: totalValue });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Thống kê sản phẩm chưa từng bán được
exports.neverSoldProducts = async (req, res) => {
  try {
    const orders = await Order.find();
    const soldProductIds = new Set();
    orders.forEach((order) => {
      order.product.forEach((item) => {
        soldProductIds.add(item.product_id.toString());
      });
    });
    const neverSold = await Product.find({
      deleted: false,
      _id: { $nin: Array.from(soldProductIds) },
    });
    res.json({ neverSoldProducts: neverSold });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
