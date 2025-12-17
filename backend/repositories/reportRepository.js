const db = require("../config/database");

class ReportRepository {
	async getCompetitorPriceComparison(productId) {
		const [rows] = await db.query(
			`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.price as product_price,
        pc.id as crawl_id,
        pc.competitor_name,
        pcl.price as competitor_price,
        pcl.crawled_at
      FROM 
        products p
      JOIN 
        product_crawls pc ON p.id = pc.product_id
      JOIN 
        product_crawl_logs pcl ON pc.id = pcl.product_crawl_id
      WHERE 
        p.id = ?
      AND 
        pcl.id IN (
          SELECT MAX(id) 
          FROM product_crawl_logs 
          WHERE product_crawl_id = pc.id
          GROUP BY product_crawl_id
        )
      ORDER BY
        pc.competitor_name ASC
    `,
			[productId]
		);

		return rows;
	}

	async getPriceAlerts() {
		const [rows] = await db.query(`
      SELECT 
        p.id as product_id,
        p.name as product_name,
        p.price as product_price,
        p.link as product_link,
        pc.id as crawl_id,
        pc.competitor_name,
        pc.link as competitor_link,
        pcl.price as competitor_price,
        (p.price - pcl.price) as price_difference,
        ((p.price - pcl.price) / p.price * 100) as percentage_difference,
        pcl.crawled_at
      FROM 
        products p
      JOIN 
        product_crawls pc ON p.id = pc.product_id
      JOIN 
        product_crawl_logs pcl ON pc.id = pcl.product_crawl_id
      WHERE 
        pcl.id IN (
          SELECT MAX(id) 
          FROM product_crawl_logs 
          WHERE product_crawl_id = pc.id
          GROUP BY product_crawl_id
        )
      AND 
        pcl.price < p.price
      ORDER BY
        percentage_difference DESC
    `);

		return rows;
	}
}

module.exports = new ReportRepository();
