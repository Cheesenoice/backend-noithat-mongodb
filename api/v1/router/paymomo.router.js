const express = require("express");
const router = express.Router();
const controller = require("../controller/paymomo.controller");

router.get("/momo_return", controller.callbackPay);

module.exports = router;
