const express = require("express");
const router = express.Router()
const validate = require("../../../validate/register.validate");
const controller = require("../controller/user.controller")

router.post("/register",validate.validateAccount, validate.checkValidation, controller.register);
router.post("/login", controller.login);
router.post("/forgot-password", controller.forgotPassword);
router.post("/password/send-otp", controller.sendOtp);
router.post("/password/reset", controller.resetPassword);
router.get("/listUser", controller.list)

module.exports = router;