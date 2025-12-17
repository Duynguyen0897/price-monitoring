const schedulerService = require("../services/schedulerService");
const logger = require("../utils/logger");

exports.getSchedulerStatus = async (req, res) => {
	try {
		const status = schedulerService.getStatus();
		res.json(status);
	} catch (error) {
		logger.error(`Error getting scheduler status: ${error.message}`);
		res.status(500).json({
			message: "Error fetching scheduler status",
			error: error.message,
		});
	}
};

exports.triggerGlobalCrawl = async (req, res) => {
	try {
		// Return response immediately
		res.status(202).json({ message: "Global crawl triggered" });

		// Execute in background
		await schedulerService.runGlobalCrawlNow();
	} catch (error) {
		logger.error(`Error triggering global crawl: ${error.message}`);
		res.status(500).json({
			message: "Error triggering global crawl",
			error: error.message,
		});
	}
};

exports.updateGlobalCrawlSchedule = async (req, res) => {
	try {
		const { cronPattern } = req.body;

		if (!cronPattern) {
			return res
				.status(400)
				.json({ message: "Cron pattern is required" });
		}

		const success = schedulerService.updateGlobalCrawlSchedule(cronPattern);

		if (success) {
			res.json({ message: "Global crawl schedule updated", cronPattern });
		} else {
			res.status(400).json({
				message: "Failed to update global crawl schedule",
			});
		}
	} catch (error) {
		logger.error(`Error updating crawl schedule: ${error.message}`);
		res.status(500).json({
			message: "Error updating crawl schedule",
			error: error.message,
		});
	}
};
