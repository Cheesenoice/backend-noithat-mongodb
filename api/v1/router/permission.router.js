const express = require("express");
const router = express.Router();
const controller = require("../controller/permission.controller");

router.get('/', controller.permission);
router.post('/create', controller.createPermission)
router.patch('/role-permmission', controller.updatePermission);

module.exports = router;