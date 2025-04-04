const express = require("express");
const router = express.Router();
const controller = require("../controller/searchAi.controller")

router.post("/", controller.aiSearch)

module.exports = router