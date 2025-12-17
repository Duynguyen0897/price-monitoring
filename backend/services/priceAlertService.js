const productRepository = require("../repositories/productRepository");
const crawlRepository = require("../repositories/crawlRepository");

class PriceAlertService {
	async checkPriceAlerts(productId) {
		// Get the original product
		const product = await productRepository.findById(productId);
		if (!product) {
			throw new Error(`Product with ID ${productId} not found`);
		}

		// Get all competitor crawls for this product
		const competitorCrawls = await crawlRepository.findByProductId(
			productId
		);
        // console.log(product, competitorCrawls);

		// Get the latest price log for each competitor
		const alerts = [];

		for (const crawl of competitorCrawls) {
			const latestLog = await crawlRepository.getLatestLogForCrawl(
				crawl.id
			);
            console.log(latestLog);
			if (latestLog && latestLog.price < product.price) {
				alerts.push({
					product: product,
					competitor: {
						id: crawl.id,
						name: crawl.competitor_name,
						link: crawl.link,
					},
					competitorPrice: latestLog.price,
					priceDifference: product.price - latestLog.price,
					percentageDifference: (
						((product.price - latestLog.price) / product.price) *
						100
					).toFixed(2),
					crawlDate: latestLog.crawled_at,
				});
			}
		}

		return alerts;
	}

	async getGlobalPriceAlerts() {
		// Get all products
		const products = await productRepository.findAll();

		// Compile alerts for all products
		const allAlerts = [];

		for (const product of products) {
			const productAlerts = await this.checkPriceAlerts(product.id);
			allAlerts.push(...productAlerts);
		}

		// Sort alerts by price difference (highest difference first)
		return allAlerts.sort((a, b) => b.priceDifference - a.priceDifference);
	}
}

module.exports = new PriceAlertService();
