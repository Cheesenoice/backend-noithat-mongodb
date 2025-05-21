const express = require("express");
const router = express.Router();
const controller = require("../controller/shippingFee.controller");
const authAdmin = require("../../../middleware/authAdmin.middleware copy");

router.get("/", authAdmin.authRequire, controller.getShippingFees);
router.post("/", authAdmin.authRequire, controller.createShippingFee);
router.patch("/:id", authAdmin.authRequire, controller.updateShippingFee);
router.delete("/:id", authAdmin.authRequire, controller.deleteShippingFee);

module.exports = router;
