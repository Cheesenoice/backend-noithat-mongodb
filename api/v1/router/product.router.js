const express = require("express");
const contoller = require("../controller/product.controller");
const router = express.Router();

router.get("/", contoller.product);
router.post("/create", contoller.create);
router.patch("/delete/:id", contoller.delete);
router.patch("/edit/:id", contoller.edit);
router.get("/detail/:id", contoller.detail);
router.patch("/change-status/:id", contoller.changeStatus);
router.patch("/change-multi", contoller.changeMulti);

// Lọc sản phẩm featured
router.get("/featured", contoller.featured);
// Cập nhật trạng thái featured cho nhiều sản phẩm
router.patch("/featured", contoller.updateFeatured);

module.exports = router;
