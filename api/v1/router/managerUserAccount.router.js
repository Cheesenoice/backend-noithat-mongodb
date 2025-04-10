const express = require("express");
const router = express.Router();
const controller = require("../controller/managerUserAccount.controller")

router.get('/', controller.listUser)
router.patch("/changeStatus/:id", controller.changeStatus)
router.patch("/change-multi", controller.changeMulti)

module.exports = router;