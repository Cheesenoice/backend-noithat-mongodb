const express = require("express");
const router = express.Router();
const controller = require("../controller/paymomo.controller")

router.get('/create_payment_momo', controller.paymomo )
router.get('/momo_return', controller.callbackPay)

module.exports = router;