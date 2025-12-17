const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

router.get(
	"/comparisons/:productId",
	reportController.getProductPriceComparison
);
router.get("/alerts", reportController.getPriceAlerts);
router.get(
	"/alerts/product/:productId",
	reportController.getProductPriceAlerts
);
router.get("/alerts/all", reportController.getAllPriceAlerts);

module.exports = router;
