const express = require("express");
const router = express.Router();
const controller = require("../controller/productClient.controller");

router.get('/', controller.product);
router.get('/:slug', controller.slugCategory)
router.get('/detail/:slugProduct', controller.detail);

module.exports = router;