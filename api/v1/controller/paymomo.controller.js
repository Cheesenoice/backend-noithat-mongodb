const momoConfig = require("../../../config/pay");

module.exports.paymomo =  async (req, res) => {
    const { amount = '10000', orderInfo = 'Thanh toán đơn hàng Node.js' } = req.body;
  
    const orderId = Date.now().toString();
    const requestId = orderId;
    const extraData = '';
  
    const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.redirectUrl}&requestId=${requestId}&requestType=${momoConfig.requestType}`;
  
    const signature = crypto
      .createHmac('sha256', momoConfig.secretKey)
      .update(rawSignature)
      .digest('hex');
  
    const requestBody = {
      partnerCode: momoConfig.partnerCode,
      accessKey: momoConfig.accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: momoConfig.redirectUrl,
      ipnUrl: momoConfig.ipnUrl,
      extraData,
      requestType: momoConfig.requestType,
      signature,
      lang: 'vi',
    };
  
    try {
      const response = await axios.post(
        'https://test-payment.momo.vn/v2/gateway/api/create',
        requestBody
      );
  
      return res.status(200).json({
        message: 'Tạo thanh toán thành công',
        payUrl: response.data.payUrl,
        orderId,
        requestId,
      });
    } catch (error) {
      console.error('MoMo payment error:', error.message);
      return res.status(500).json({ error: 'Tạo thanh toán thất bại' });
    }
  }
  
  module.exports.callbackPay = (req, res) => {
    const resultCode = req.query.resultCode;
  
    if (resultCode === '0') {
      res.json({ success: true, message: 'Thanh toán thành công', data: req.query });
    } else {
      res.json({ success: false, message: 'Thanh toán thất bại', data: req.query });
    }
  };