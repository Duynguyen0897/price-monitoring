class ProductCrawl {
	constructor(data) {
		this.id = data.id;
		this.product_id = data.product_id;
		this.link = data.link;
		this.competitor_name = data.competitor_name;
		this.created_at = data.created_at;
		this.updated_at = data.updated_at;
	}
}

module.exports = ProductCrawl;
