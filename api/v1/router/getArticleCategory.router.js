const express = require("express");
const router = express.Router();
const controller = require("../controller/getArticleCategory.controller");

router.get('/', controller.article);
router.get('/:slug', controller.slugCategory)
router.get('/detail/:slugArticle', controller.detail);

module.exports = router;