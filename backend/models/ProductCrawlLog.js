class ProductCrawlLog {
	constructor(data) {
		this.id = data.id;
		this.product_crawl_id = data.product_crawl_id;
		this.name = data.name;
		this.sku = data.sku;
		this.price = data.price;
		this.data = data.data; // JSON data from Gemini
		this.screenshot_path = data.screenshot_path;
		this.crawled_at = data.crawled_at;
	}
}

module.exports = ProductCrawlLog;
