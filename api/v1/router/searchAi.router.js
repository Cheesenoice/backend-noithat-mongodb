const express = require("express");
const router = express.Router();
const controller = require("../controller/searchAi.controller");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
router.post("/", upload.single("roomImage"), controller.aiSearch);

module.exports = router;
