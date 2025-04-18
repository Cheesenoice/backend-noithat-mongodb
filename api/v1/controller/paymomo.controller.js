const https = require("https");
const crypto = require("crypto");
const Pay = require("../../../model/pay.model");
const Order = require("../../../model/oder.model");

const momoPayment = (momoOrderId, amount, redirectUrl, ipnUrl) => {
  const partnerCode = "MOMO";
  const accessKey = "F8BBA842ECF85";
  const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  const requestId = `${partnerCode}${Date.now()}`;
  const orderInfo = "Pay with MoMo";
  const requestType = "payWithMethod";
  const extraData = "";

  const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${momoOrderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
  console.log("Raw Signature:", rawSignature);

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
  console.log("Signature:", signature);

  const requestBody = JSON.stringify({
    partnerCode,
    accessKey,
    requestId,
    amount,
    orderId: momoOrderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    extraData,
    requestType,
    signature,
    lang: "en",
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "test-payment.momo.vn",
      port: 443,
      path: "/v2/gateway/api/create",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(requestBody),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const response = JSON.parse(data);
        console.log("MoMo Response:", response);
        if (response.payUrl) resolve(response.payUrl);
        else
          reject(
            new Error(`Failed to get payUrl: ${JSON.stringify(response)}`)
          );
      });
    });

    req.on("error", (e) =>
      reject(new Error(`MoMo request failed: ${e.message}`))
    );
    req.write(requestBody);
    req.end();
  });
};

const paymomo = async (orderId, amount) => {
  try {
    if (!orderId) {
      throw new Error("Thiếu orderId");
    }
    if (!amount) {
      throw new Error("Thiếu số tiền");
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error("Đơn hàng không tồn tại");
    }

    if (order.paymentMethod !== "momo") {
      throw new Error("Đơn hàng không sử dụng phương thức MoMo");
    }

    const amountNum = parseInt(amount);
    if (amountNum < 1000 || amountNum > 50000000) {
      throw new Error(
        "Số tiền không hợp lệ: phải từ 1000 VND đến 50,000,000 VND"
      );
    }

    const redirectUrl =
      "https://dc1c-118-71-93-163.ngrok-free.app/api/v1/pay/momo_return"; // Thay bằng URL thực tế
    const ipnUrl =
      "https://dc1c-118-71-93-163.ngrok-free.app/api/v1/pay/momo_return"; // Thay bằng URL thực tế

    // Cập nhật amount vào document pay
    await Pay.updateOne(
      { orderId },
      { amount: amountNum, requestId: `${momoConfig.partnerCode}${Date.now()}` }
    );

    // Gọi MoMo API
    const payUrl = await momoPayment(orderId, amount, redirectUrl, ipnUrl);
    return payUrl;
  } catch (error) {
    console.error("Paymomo error:", error.message);
    throw new Error(`Paymomo error: ${error.message}`);
  }
};

const callbackPay = async (req, res) => {
  try {
    const { orderId, resultCode, transId, responseTime, message } = req.query;

    console.log("MoMo Callback:", req.query);

    if (!orderId) {
      return res.status(400).json({ success: false, message: "Thiếu orderId" });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Đơn hàng không tồn tại" });
    }

    const pay = await Pay.findOne({ orderId });
    if (!pay) {
      return res
        .status(404)
        .json({ success: false, message: "Giao dịch không tồn tại" });
    }

    if (resultCode === "0") {
      // Thanh toán thành công
      await Order.updateOne(
        { _id: orderId },
        { paymentStatus: "completed", updatedAt: Date.now() }
      );
      await Pay.updateOne(
        { orderId },
        {
          status: "completed",
          transactionId: transId,
          momoResponse: req.query,
          updatedAt: Date.now(),
        }
      );
      // Redirect về trang /thank-you trên frontend
      return res.redirect("https://yourfrontend.com/thank-you"); // Thay bằng URL frontend thực tế
    } else {
      // Thanh toán thất bại
      await Order.updateOne(
        { _id: orderId },
        { paymentStatus: "failed", updatedAt: Date.now() }
      );
      await Pay.updateOne(
        { orderId },
        {
          status: "failed",
          momoResponse: req.query,
          updatedAt: Date.now(),
        }
      );
      return res.status(400).json({
        success: false,
        message: `Thanh toán MoMo thất bại: ${message || "Lỗi không xác định"}`,
        data: req.query,
      });
    }
  } catch (error) {
    console.error("Callback pay error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xử lý callback MoMo",
    });
  }
};

module.exports = {
  paymomo,
  callbackPay,
};

// Để tương thích với mã cũ
const momoConfig = {
  partnerCode: "MOMO",
  accessKey: "F8BBA842ECF85",
  secretKey: "K951B6PE1waDMi640xX08PD3vg6EkVlz",
};
