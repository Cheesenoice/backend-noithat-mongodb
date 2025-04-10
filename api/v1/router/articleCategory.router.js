const express = require("express")
const controller = require("../controller/articleCategory.controller")
const router = express.Router();


router.get("/", controller.articleCategory)
router.post("/create", controller.create)
router.patch("/edit/:id", controller.edit)
router.patch("/delete/:id", controller.delete)
router.get("/detail/:id", controller.detail)
router.patch("/change-status/:id", controller.changeStatus)
router.patch("/change-multi", controller.changeMulti)

module.exports = router;