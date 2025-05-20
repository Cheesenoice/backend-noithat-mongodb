const express = require("express");
const router = express.Router();
const dashboardController = require("../controller/dasboard.controller");

router.get("/total-products", dashboardController.totalProducts);
router.get("/total-users", dashboardController.totalUsers);
router.get("/total-revenue", dashboardController.totalRevenue);
router.get("/top-products", dashboardController.topProducts);
router.get("/order-status-stats", dashboardController.orderStatusStats);
router.get("/total-inventory-value", dashboardController.totalInventoryValue);
router.get("/low-stock-products", dashboardController.lowStockProducts);
router.get("/never-sold-products", dashboardController.neverSoldProducts);

module.exports = router;
