const cron = require("node-cron");
const crawlService = require("./crawlService");
const crawlRepository = require("../repositories/crawlRepository");
const logger = require("../utils/logger");

class SchedulerService {
	constructor() {
		this.jobs = {};
		this.isInitialized = false;
	}

	// Initialize the scheduler and start the default jobs
	initialize() {
		if (this.isInitialized) {
			return;
		}

		// Schedule the job to run every 2 hours
		// this.scheduleGlobalCrawl("0 */2 * * *"); // Runs at minute 0 of every 2nd hour
        this.scheduleGlobalCrawl("*/5 * * * *"); // Runs every 5 minutes

		this.isInitialized = true;
		logger.info(
			"Scheduler service initialized - Global crawl scheduled every 2 hours"
		);
	}

	// Schedule global crawl with a specific cron pattern
	scheduleGlobalCrawl(cronPattern) {
		// Stop existing job if it exists
		if (this.jobs.globalCrawl) {
			this.jobs.globalCrawl.stop();
		}

		// Create a new job
		this.jobs.globalCrawl = cron.schedule(cronPattern, async () => {
			await this.executeGlobalCrawl();
		});

		logger.info(`Global crawl scheduled with pattern: ${cronPattern}`);
		return true;
	}

	// Execute the global crawl task
	async executeGlobalCrawl() {
		try {
			logger.info("Starting scheduled global crawl");

			// Get all active crawls
			const crawls = await crawlRepository.findAll();

			if (crawls.length === 0) {
				logger.info("No competitor products found to crawl");
				return;
			}

			logger.info(`Found ${crawls.length} competitor products to crawl`);

			// Process each crawl with a small delay between them
			for (const crawl of crawls) {
				try {
					logger.info(`Crawling competitor product ID ${crawl.id}`);
					await crawlService.crawlCompetitorProduct(crawl.id);

					// Add a small delay between crawls
					await new Promise((resolve) => setTimeout(resolve, 3000));
				} catch (crawlError) {
					logger.error(
						`Error during scheduled crawl for ID ${crawl.id}: ${crawlError.message}`
					);
				}
			}

			logger.info(
				`Completed scheduled crawling of ${crawls.length} competitor products`
			);
		} catch (error) {
			logger.error(
				`Error executing scheduled global crawl: ${error.message}`
			);
		}
	}

	// Get current scheduler status
	getStatus() {
		return {
			isInitialized: this.isInitialized,
			jobs: Object.keys(this.jobs).map((key) => ({
				name: key,
				isRunning: this.jobs[key] ? true : false,
			})),
		};
	}

	// Run the global crawl immediately (manual trigger)
	async runGlobalCrawlNow() {
		await this.executeGlobalCrawl();
		return true;
	}

	// Change the schedule of the global crawl
	updateGlobalCrawlSchedule(cronPattern) {
		return this.scheduleGlobalCrawl(cronPattern);
	}
}

module.exports = new SchedulerService();
