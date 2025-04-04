const express = require("express");
const router = express.Router();
const controller = require("../controller/article.controller");

router.get("/", controller.article);
router.post("/create", controller.create)
router.patch("/delete/:id", controller.delete)
router.patch("/edit/:id", controller.edit);
router.get("/detail/:id", controller.detail)
router.patch("/change-status/:id", controller.changeStatus)
router.patch("/change-multi", controller.changeMulti)

module.exports = router;