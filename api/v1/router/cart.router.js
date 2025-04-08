const express = require('express');
const router = express.Router();
const controller = require("../controller/cart.controller")

router.get('/', controller.cart)
router.post('/add/:id', controller.addCart)
router.get('/delete/:id', controller.deleteCart)
router.get('/update/:id/:quantity', controller.updateCart)

module.exports = router;