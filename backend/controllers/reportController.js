const reportRepository = require("../repositories/reportRepository");
const priceAlertService = require("../services/priceAlertService");
const logger = require("../utils/logger");

exports.getProductPriceComparison = async (req, res) => {
	try {
		const productId = req.params.productId;
		const comparison = await reportRepository.getCompetitorPriceComparison(
			productId
		);
        console.log(productId, comparison);
		res.json(comparison);
	} catch (error) {
		logger.error(`Error getting price comparison: ${error.message}`);
		res.status(500).json({
			message: "Error fetching price comparison",
			error: error.message,
		});
	}
};

exports.getPriceAlerts = async (req, res) => {
	try {
		const alerts = await reportRepository.getPriceAlerts();
		res.json(alerts);
	} catch (error) {
		logger.error(`Error getting price alerts: ${error.message}`);
		res.status(500).json({
			message: "Error fetching price alerts",
			error: error.message,
		});
	}
};

exports.getProductPriceAlerts = async (req, res) => {
	try {
		const productId = req.params.productId;
		const alerts = await priceAlertService.checkPriceAlerts(productId);
		res.json(alerts);
	} catch (error) {
		logger.error(`Error getting product price alerts: ${error.message}`);
		res.status(500).json({
			message: "Error fetching product price alerts",
			error: error.message,
		});
	}
};

exports.getAllPriceAlerts = async (req, res) => {
	try {
		const alerts = await priceAlertService.getGlobalPriceAlerts();
		res.json(alerts);
	} catch (error) {
		logger.error(`Error getting all price alerts: ${error.message}`);
		res.status(500).json({
			message: "Error fetching price alerts",
			error: error.message,
		});
	}
};
