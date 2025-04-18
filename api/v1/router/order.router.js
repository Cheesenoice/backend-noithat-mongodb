const express = require("express");
const router = express.Router();
const orderController = require("../controller/order.controller");

// Route to get all orders for the logged-in user
router.get("/", orderController.myOrder);

module.exports = router;
