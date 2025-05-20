const express = require("express");
const router = express.Router();
const authAdmin = require("../../../middleware/authAdmin.middleware copy");
const orderController = require("../controller/order.controller");

router.get("/all-orders", orderController.getAllOrders); // Route to get all orders
router.get("/my-order", orderController.myOrder);
router.get(
  "/:userid",
  authAdmin.authRequire,
  orderController.getOrdersByUserId
);
router.put(
  "/update-status/:id",
  authAdmin.authRequire,
  orderController.updateStatus
);

module.exports = router;
