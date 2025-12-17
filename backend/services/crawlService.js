const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const geminiService = require("./geminiService");
const crawlRepository = require("../repositories/crawlRepository");
const logger = require("../utils/logger");

class CrawlService {
	async crawlCompetitorProduct(productCrawlId) {
		const productCrawl = await crawlRepository.findById(productCrawlId);
		if (!productCrawl) {
			throw new Error(`ProductCrawl with ID ${productCrawlId} not found`);
		}

		const browser = await puppeteer.launch({
			headless: true,
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
		});

		try {
			const page = await browser.newPage();
			await page.setViewport({ width: 1280, height: 800 });

			logger.info(`Crawling URL: ${productCrawl.link}`);
			await page.goto(productCrawl.link, {
				waitUntil: "networkidle2",
				timeout: 60000,
			});

			// Ensure screenshots directory exists
			const screenshotsDir = path.join(__dirname, "../../screenshots");
			if (!fs.existsSync(screenshotsDir)) {
				fs.mkdirSync(screenshotsDir, { recursive: true });
			}

			// Take a screenshot
			const timestamp = new Date().getTime();
			const screenshotPath = path.join(
				screenshotsDir,
				`crawl_${productCrawlId}_${timestamp}.png`
			);
			await page.screenshot({ path: screenshotPath, fullPage: false });

			// Use Gemini to extract product data from the screenshot
			const geminiResponse =
				await geminiService.extractProductDataFromImage(screenshotPath);

			// Save the crawl result
			const crawlData = {
				product_crawl_id: productCrawlId,
				name: geminiResponse.name || "Unknown",
				sku: geminiResponse.sku || "Unknown",
				price: parseFloat(geminiResponse.price) || 0,
				data: JSON.stringify(geminiResponse),
				screenshot_path: screenshotPath,
				crawled_at: new Date(),
			};

			const crawlLog = await crawlRepository.createLog(crawlData);
			return crawlLog;
		} catch (error) {
			logger.error(`Error crawling product: ${error.message}`);
			throw error;
		} finally {
			await browser.close();
		}
	}
}

module.exports = new CrawlService();
