const express = require("express");
const controller = require("../controller/products-category.controller");
const authAdmin = require("../../../middleware/authAdmin.middleware copy");
const router = express.Router();

router.get("/", controller.productsCategory); // Public GET

// Use the correct middleware function (e.g., authAdmin.authRequire)
router.post("/create", authAdmin.authRequire, controller.create);
router.patch("/edit/:id", authAdmin.authRequire, controller.edit);
router.patch("/delete/:id", authAdmin.authRequire, controller.delete);
router.get("/detail/:id", authAdmin.authRequire, controller.detail);
router.patch(
  "/change-status/:id",
  authAdmin.authRequire,
  controller.changeStatus
);
router.patch("/change-multi", authAdmin.authRequire, controller.changeMulti);

module.exports = router;
