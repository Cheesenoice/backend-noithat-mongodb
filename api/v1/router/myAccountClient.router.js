const express = require("express");
const router = express.Router();
const controller =  require("../controller/my-accountClient.controller");

router.get('/', controller.myAccountClient);
router.patch('/edit', controller.edit);
module.exports = router;