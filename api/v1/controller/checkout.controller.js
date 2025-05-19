const Pay = require("../../../model/pay.model");
const Order = require("../../../model/oder.model");
const Cart = require("../../../model/cart.model");
const Product = require("../../../model/product.model");
const productHelper = require("../../../helper/product.priceNew");
const { paymomo } = require("./paymomo.controller");
const Account = require("../../../model/user.model");
const { Client } = require("@googlemaps/google-maps-services-js");

// Khởi tạo mapsClient
const mapsClient = new Client({});

// Tọa độ kho (đã geocoded trước để tối ưu)
const WAREHOUSE_LOCATION = {
  lat: 10.787628,
  lng: 106.697056,
};

// Hàm tính cước phí
function calculateFee(distanceInMeters) {
  const distanceInKm = distanceInMeters / 1000;
  let fee = 0;
  const baseFee = 20000; // Phí cố định cho 3km đầu
  const ratePerKm = 5000; // Phí cho mỗi km tiếp theo
  const baseDistanceKm = 3;

  if (distanceInKm <= 0) return 0;
  if (distanceInKm <= baseDistanceKm) {
    fee = baseFee;
  } else {
    fee = baseFee + (distanceInKm - baseDistanceKm) * ratePerKm;
  }
  return Math.round(fee / 1000) * 1000; // Làm tròn đến hàng nghìn
}

module.exports.checkout = async (req, res) => {
  try {
    // Kiểm tra API key
    if (!process.env.Maps_API_KEY) {
      return res.status(500).json({
        status: "error",
        message: "Google Maps API key is not configured.",
      });
    }

    const token = req.cookies.token;
    const addressId = req.params.id; // Lấy addressId từ params
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

    // Tìm địa chỉ được chọn hoặc địa chỉ mặc định
    let selectedAddress;
    if (addressId) {
      selectedAddress = user.address.find(
        (addr) => addr._id.toString() === addressId
      );
      if (!selectedAddress) {
        return res
          .status(400)
          .json({
            status: "error",
            message: "Địa chỉ được chọn không tồn tại.",
          });
      }
    } else {
      selectedAddress = user.address.find((addr) => addr.isDefault === true);
      if (!selectedAddress) {
        return res.status(400).json({
          status: "error",
          message:
            "Không tìm thấy địa chỉ mặc định. Vui lòng thiết lập địa chỉ mặc định.",
        });
      }
    }
    const userAddressString = `${selectedAddress.fullAddress}, Việt Nam`;

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

    // Tính phí vận chuyển
    let shippingFee = 0;
    try {
      // Geocoding địa chỉ được chọn
      console.log(`Geocoding address: ${userAddressString}`);
      const geocodeResponse = await mapsClient.geocode({
        params: {
          address: userAddressString,
          region: "vn",
          key: process.env.Maps_API_KEY,
        },
        timeout: 10000,
      });

      if (
        !geocodeResponse.data.results ||
        geocodeResponse.data.results.length === 0
      ) {
        console.error("Geocoding failed:", geocodeResponse.data.status);
        return res.status(404).json({
          status: "error",
          message: `Không tìm thấy tọa độ cho địa chỉ: ${userAddressString}. Vui lòng kiểm tra lại.`,
        });
      }

      const userLocation = geocodeResponse.data.results[0].geometry.location;
      console.log(
        `Geocoded to: ${geocodeResponse.data.results[0].formatted_address}`,
        userLocation
      );

      // Tính khoảng cách
      console.log(`Calculating distance to`, userLocation);
      const distanceResponse = await mapsClient.distancematrix({
        params: {
          origins: [WAREHOUSE_LOCATION],
          destinations: [userLocation],
          mode: "DRIVING",
          units: "metric",
          region: "vn",
          key: process.env.Maps_API_KEY,
        },
        timeout: 10000,
      });

      if (distanceResponse.data.rows[0].elements[0].status !== "OK") {
        console.error(
          "Distance Matrix failed:",
          distanceResponse.data.rows[0].elements[0].status
        );
        return res.status(500).json({
          status: "error",
          message: "Không thể tính được khoảng cách đến địa chỉ được chọn.",
        });
      }

      const distanceResult = distanceResponse.data.rows[0].elements[0].distance;
      shippingFee = calculateFee(distanceResult.value);
      console.log(`Calculated Shipping Fee: ${shippingFee}`);
    } catch (error) {
      console.error("Shipping Fee Calculation Error:", error.message);
      return res.status(500).json({
        status: "error",
        message: "Lỗi khi tính phí vận chuyển.",
      });
    }

    // Cộng phí vận chuyển vào tổng giá
    totalPrice += shippingFee;

    res.status(200).json({
      status: "success",
      data: {
        userId,
        address: user.address,
        selectedAddress: {
          fullAddress: selectedAddress.fullAddress,
          isDefault: selectedAddress.isDefault,
          _id: selectedAddress._id,
        },
        cartId: cart._id,
        items: detailedItems,
        subtotal: totalPrice - shippingFee,
        shippingFee,
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
    // Kiểm tra API key
    if (!process.env.Maps_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Google Maps API key is not configured.",
      });
    }

    const token = req.cookies.token;
    const { name, email, addressId, phone, paymentMethod } = req.body;

    if (!token || !name || !email || !addressId || !phone || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message:
          "Thiếu thông tin bắt buộc: name, email, addressId, phone, hoặc paymentMethod",
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

    // Tìm địa chỉ được chọn
    const selectedAddress = user.address.find(
      (addr) => addr._id.toString() === addressId
    );
    if (!selectedAddress) {
      return res
        .status(400)
        .json({ success: false, message: "Địa chỉ được chọn không tồn tại." });
    }
    const userAddressString = `${selectedAddress.fullAddress}, Việt Nam`;

    // Find active cart for user
    const cart = await Cart.findOne({ userId: userId, status: "active" });
    if (!cart || !cart.product.length) {
      return res.status(404).json({
        success: false,
        message: "Giỏ hàng không tồn tại hoặc trống",
      });
    }

    const products = [];
    let subtotal = 0;
    const detailedItems = [];
    for (const product of cart.product) {
      const productInfor = await Product.findOne({ _id: product.product_id });
      if (!productInfor) continue;
      const priceAfterDiscount = productHelper.productPriceNew(productInfor);
      const itemTotalPrice = product.quantity * priceAfterDiscount;
      subtotal += itemTotalPrice;
      products.push({
        product_id: product.product_id,
        price: productInfor.price,
        discountPercentage: productInfor.discountPercentage,
        quantity: product.quantity,
      });
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
        priceNew: priceAfterDiscount,
        quantity: product.quantity,
        totalPrice: itemTotalPrice,
      });
    }

    // Tính phí vận chuyển
    let shippingFee = 0;
    try {
      const geocodeResponse = await mapsClient.geocode({
        params: {
          address: userAddressString,
          region: "vn",
          key: process.env.Maps_API_KEY,
        },
        timeout: 10000,
      });

      if (
        !geocodeResponse.data.results ||
        geocodeResponse.data.results.length === 0
      ) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy tọa độ cho địa chỉ: ${userAddressString}.`,
        });
      }

      const userLocation = geocodeResponse.data.results[0].geometry.location;
      const formattedAddress =
        geocodeResponse.data.results[0].formatted_address;
      console.log(`Geocoded to: ${formattedAddress}`, userLocation);

      const distanceResponse = await mapsClient.distancematrix({
        params: {
          origins: [WAREHOUSE_LOCATION],
          destinations: [userLocation],
          mode: "DRIVING",
          units: "metric",
          region: "vn",
          key: process.env.Maps_API_KEY,
        },
        timeout: 10000,
      });

      if (distanceResponse.data.rows[0].elements[0].status !== "OK") {
        console.error(
          "Distance Matrix failed:",
          distanceResponse.data.rows[0].elements[0].status
        );
        return res.status(500).json({
          success: false,
          message: "Không thể tính được khoảng cách đến địa chỉ được chọn.",
        });
      }

      const distanceResult = distanceResponse.data.rows[0].elements[0].distance;
      shippingFee = calculateFee(distanceResult.value);
      console.log(`Calculated Shipping Fee: ${shippingFee}`);
    } catch (error) {
      console.error("Shipping Fee Calculation Error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Lỗi khi tính phí vận chuyển.",
      });
    }

    // Tổng tiền bao gồm phí vận chuyển
    const totalPrice = Math.round(subtotal + shippingFee);

    if (totalPrice < 1000 || totalPrice > 50000000) {
      return res.status(400).json({
        success: false,
        message: "Số tiền không hợp lệ: phải từ 1000 VND đến 50,000,000 VND",
      });
    }

    const newOrder = new Order({
      cartId: cart._id,
      userId: cart.userId,
      user_infor: {
        name,
        email,
        address: selectedAddress.fullAddress,
        phone,
      },
      product: products,
      paymentMethod,
      paymentStatus: "pending",
      subtotal,
      shippingFee,
      totalPrice,
      orderStatus: [
        {
          status: "Receiving orders",
          updatedAt: new Date(),
        },
      ],
    });

    await newOrder.save();

    // Lưu giao dịch vào collection pay
    const newPay = new Pay({
      orderId: newOrder._id,
      paymentMethod,
      amount: totalPrice,
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
        data: {
          userId,
          selectedAddress: {
            fullAddress: selectedAddress.fullAddress,
            isDefault: selectedAddress.isDefault,
            _id: selectedAddress._id,
          },
          cartId: cart._id,
          items: detailedItems,
          subtotal,
          shippingFee,
          totalPrice,
        },
      });
    }

    // Nếu là MoMo, tạo thanh toán
    try {
      const payUrl = await paymomo(newOrder._id, totalPrice.toString());
      return res.status(201).json({
        success: true,
        message: "Đơn hàng đã được tạo, chuyển hướng đến thanh toán MoMo",
        orderId: newOrder._id,
        payUrl,
        data: {
          userId,
          selectedAddress: {
            fullAddress: selectedAddress.fullAddress,
            isDefault: selectedAddress.isDefault,
            _id: selectedAddress._id,
          },
          cartId: cart._id,
          items: detailedItems,
          subtotal,
          shippingFee,
          totalPrice,
        },
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
