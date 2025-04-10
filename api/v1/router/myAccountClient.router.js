const express = require("express");
const router = express.Router();
const controller =  require("../controller/my-accountClient.controller");
const validate = require("../../../validate/register.validate");

router.get('/', controller.myAccountClient);
router.patch('/edit', validate.editPath, controller.edit);
module.exports = router;