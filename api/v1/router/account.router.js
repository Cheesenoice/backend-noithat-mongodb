const express = require("express");
const router = express.Router();
const controller = require("../controller/account.controller")
const validateAdmin = require("../../../validate/register.validate")
const validateAccount = require("../../../validate/account.validate")
const middleware = require("../../../middleware/authAdmin.middleware copy")
router.get("/", controller.account)
router.post("/create", middleware.authRequire, controller.create);
router.patch("/edit/:id", validateAccount.editPath, validateAdmin.validateAccount, validateAdmin.checkValidation, controller.edit)
router.patch("/delete/:id", controller.delete)
router.patch("/changeStatus/:id", controller.changeStatus)
router.patch("/change-multi", controller.changeMulti)

module.exports = router;