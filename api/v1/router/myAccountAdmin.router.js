const express = require("express");
const router = express.Router();
const controller =  require("../controller/my-accountAdmin.controller");

router.get('/', controller.myAccountAdmin);
router.patch('/edit', controller.edit);
module.exports = router;