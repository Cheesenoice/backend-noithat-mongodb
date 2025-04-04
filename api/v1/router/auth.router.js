const express = require("express");
const router = express.Router();
const controller = require("../controller/auth.controller");
const validate = require("../../../validate/login.validate")

router.post("/login", validate.loginValidate, controller.login);
router.get("/logout", controller.logout);
  


module.exports = router;