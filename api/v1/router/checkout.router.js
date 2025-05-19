const express = require("express");
const router = express.Router();
const controller = require("../controller/checkout.controller");

router.get("/", controller.checkout);
router.get("/:id", controller.checkout);
router.post("/order", controller.order);

module.exports = router;
