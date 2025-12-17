const crawlRepository = require("../repositories/crawlRepository");
const crawlService = require("../services/crawlService");
const logger = require("../utils/logger");

exports.getAllCrawls = async (req, res) => {
	try {
		const crawls = await crawlRepository.findAll();
		res.json(crawls);
	} catch (error) {
		logger.error(`Error getting crawls: ${error.message}`);
		res.status(500).json({
			message: "Error fetching crawls",
			error: error.message,
		});
	}
};

exports.getCrawlsByProduct = async (req, res) => {
	try {
		const crawls = await crawlRepository.findByProductId(
			req.params.productId
		);
		res.json(crawls);
	} catch (error) {
		logger.error(`Error getting crawls for product: ${error.message}`);
		res.status(500).json({
			message: "Error fetching crawls",
			error: error.message,
		});
	}
};

exports.getCrawl = async (req, res) => {
	try {
		const crawl = await crawlRepository.findById(req.params.id);
		if (!crawl) {
			return res.status(404).json({ message: "Crawl not found" });
		}
		res.json(crawl);
	} catch (error) {
		logger.error(`Error getting crawl: ${error.message}`);
		res.status(500).json({
			message: "Error fetching crawl",
			error: error.message,
		});
	}
};

exports.createCrawl = async (req, res) => {
	try {
		const { product_id, link, competitor_name } = req.body;

		if (!product_id || !link) {
			return res
				.status(400)
				.json({ message: "Product ID and link are required" });
		}

		const crawl = await crawlRepository.create({
			product_id,
			link,
			competitor_name,
		});
		res.status(201).json(crawl);
	} catch (error) {
		logger.error(`Error creating crawl: ${error.message}`);
		res.status(500).json({
			message: "Error creating crawl",
			error: error.message,
		});
	}
};

exports.updateCrawl = async (req, res) => {
	try {
		const { link, competitor_name } = req.body;
		const crawl = await crawlRepository.update(req.params.id, {
			link,
			competitor_name,
		});
		if (!crawl) {
			return res.status(404).json({ message: "Crawl not found" });
		}
		res.json(crawl);
	} catch (error) {
		logger.error(`Error updating crawl: ${error.message}`);
		res.status(500).json({
			message: "Error updating crawl",
			error: error.message,
		});
	}
};

exports.deleteCrawl = async (req, res) => {
	try {
		const result = await crawlRepository.delete(req.params.id);
		res.json({ success: result });
	} catch (error) {
		logger.error(`Error deleting crawl: ${error.message}`);
		res.status(500).json({
			message: "Error deleting crawl",
			error: error.message,
		});
	}
};

exports.startCrawl = async (req, res) => {
	try {
		const crawlId = req.params.id;
		const crawl = await crawlRepository.findById(crawlId);

		if (!crawl) {
			return res.status(404).json({ message: "Crawl not found" });
		}

		// Start crawling asynchronously and return immediately
		res.status(202).json({ message: "Crawl started", crawlId });

		try {
			// This will run after the response is sent
			const result = await crawlService.crawlCompetitorProduct(crawlId);
			logger.info(`Crawl completed successfully for ID ${crawlId}`);
		} catch (crawlError) {
			logger.error(
				`Error during crawl process for ID ${crawlId}: ${crawlError.message}`
			);
		}
	} catch (error) {
		logger.error(`Error starting crawl: ${error.message}`);
		res.status(500).json({
			message: "Error starting crawl",
			error: error.message,
		});
	}
};

exports.getCrawlLogs = async (req, res) => {
	try {
		const logs = await crawlRepository.getLogsForCrawl(req.params.id);
		res.json(logs);
	} catch (error) {
		logger.error(`Error getting crawl logs: ${error.message}`);
		res.status(500).json({
			message: "Error fetching crawl logs",
			error: error.message,
		});
	}
};

exports.getLatestCrawlLog = async (req, res) => {
	try {
		const log = await crawlRepository.getLatestLogForCrawl(req.params.id);
		if (!log) {
			return res
				.status(404)
				.json({ message: "No logs found for this crawl" });
		}
		res.json(log);
	} catch (error) {
		logger.error(`Error getting latest crawl log: ${error.message}`);
		res.status(500).json({
			message: "Error fetching crawl log",
			error: error.message,
		});
	}
};

// ...existing code...

exports.startCrawlAll = async (req, res) => {
	try {
		const { productId } = req.query;
		let crawls;

		if (productId) {
			// If productId is provided, only crawl competitors for that product
			crawls = await crawlRepository.findByProductId(productId);
		} else {
			// Otherwise crawl all competitors
			crawls = await crawlRepository.findAll();
		}

		if (crawls.length === 0) {
			return res
				.status(404)
				.json({ message: "No competitor products found to crawl" });
		}

		// Return immediately to client
		res.status(202).json({
			message: `Started crawling ${crawls.length} competitor products`,
			count: crawls.length,
		});

		// Process crawls asynchronously
		(async () => {
			for (const crawl of crawls) {
				try {
					logger.info(`Crawling competitor product ID ${crawl.id}`);
					await crawlService.crawlCompetitorProduct(crawl.id);

					// Add a small delay between crawls to avoid overwhelming the system
					await new Promise((resolve) => setTimeout(resolve, 2000));
				} catch (crawlError) {
					logger.error(
						`Error during crawl process for ID ${crawl.id}: ${crawlError.message}`
					);
				}
			}
			logger.info(
				`Completed crawling ${crawls.length} competitor products`
			);
		})();
	} catch (error) {
		logger.error(`Error starting bulk crawl: ${error.message}`);
		res.status(500).json({
			message: "Error starting bulk crawl",
			error: error.message,
		});
	}
};

// ...existing code...
