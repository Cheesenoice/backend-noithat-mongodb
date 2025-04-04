const express = require("express")
const contoller = require("../controller/products-category.controller")
const router = express.Router();


router.get("/", contoller.productsCategory)
router.post("/create", contoller.create)
router.patch("/edit/:id", contoller.edit)
router.patch("/delete/:id", contoller.delete)
router.get("/detail/:id", contoller.detail)
router.patch("/change-status/:id", contoller.changeStatus)
router.patch("/change-multi", contoller.changeMulti)



module.exports = router;