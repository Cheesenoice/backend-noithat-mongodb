const express = require("express");
const router = express.Router();
const controller = require("../controller/cart.controller");

router.get("/", controller.cart);
router.post("/add/:id", controller.addCart);
router.delete("/delete/:id", controller.deleteCart);
router.patch("/update/:id", controller.updateCart);

module.exports = router;
