const express = require("express");
const router = express.Router();
const controller = require("../controller/checkout.controller")

router.get("/", controller.checkout)
router.post("/order", controller.order)
router.get("/detail/:id", controller.getOrderDetails)
module.exports = router;