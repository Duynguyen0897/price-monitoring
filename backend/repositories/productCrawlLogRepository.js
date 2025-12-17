// server/repositories/productCrawlLogRepository.js
const db = require("../config/database");

class ProductCrawlLogRepository {
	// Créer un nouveau log de crawl
	async create(logData) {
		const { product_crawl_id, name, sku, price, data, screenshot_path } =
			logData;
		const sql = `
      INSERT INTO product_crawl_logs 
      (product_crawl_id, name, sku, price, data, screenshot_path) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
		const result = await db.query(sql, [
			product_crawl_id,
			name,
			sku,
			price,
			JSON.stringify(data),
			screenshot_path,
		]);

		return {
			id: result.insertId,
			...logData,
		};
	}

	// Récupérer un log par ID
	async findById(id) {
		const sql = "SELECT * FROM product_crawl_logs WHERE id = ?";
		const results = await db.query(sql, [id]);

		if (results.length) {
			const log = results[0];
			// Convertir la chaîne JSON en objet
			log.data = JSON.parse(log.data);
			return log;
		}

		return null;
	}

	// Récupérer tous les logs pour un lien de crawl spécifique
	async findByProductCrawlId(productCrawlId) {
		const sql =
			"SELECT * FROM product_crawl_logs WHERE product_crawl_id = ? ORDER BY created_at DESC";
		const logs = await db.query(sql, [productCrawlId]);

		// Convertir les chaînes JSON en objets
		return logs.map((log) => ({
			...log,
			data: JSON.parse(log.data),
		}));
	}

	// Récupérer le dernier log pour un lien de crawl spécifique
	async findLatestByProductCrawlId(productCrawlId) {
		const sql =
			"SELECT * FROM product_crawl_logs WHERE product_crawl_id = ? ORDER BY created_at DESC LIMIT 1";
		const results = await db.query(sql, [productCrawlId]);

		if (results.length) {
			const log = results[0];
			// Convertir la chaîne JSON en objet
			log.data = JSON.parse(log.data);
			return log;
		}

		return null;
	}

	// Récupérer tous les logs avec les informations de produit
	async findAllWithProductInfo() {
		const sql = `
      SELECT 
        pcl.*, 
        pc.link as competitor_link,
        p.id as product_id,
        p.name as product_name,
        p.price as product_price,
        p.link as product_link
      FROM product_crawl_logs pcl
      JOIN product_crawls pc ON pcl.product_crawl_id = pc.id
      JOIN products p ON pc.product_id = p.id
      ORDER BY pcl.created_at DESC
    `;

		const logs = await db.query(sql);

		// Convertir les chaînes JSON en objets
		return logs.map((log) => ({
			...log,
			data: JSON.parse(log.data),
		}));
	}

	// Supprimer un log
	async delete(id) {
		const sql = "DELETE FROM product_crawl_logs WHERE id = ?";
		await db.query(sql, [id]);
		return { id };
	}

	// Supprimer tous les logs pour un lien de crawl spécifique
	async deleteByProductCrawlId(productCrawlId) {
		const sql = "DELETE FROM product_crawl_logs WHERE product_crawl_id = ?";
		await db.query(sql, [productCrawlId]);
		return { product_crawl_id: productCrawlId };
	}

	// Récupérer les logs où le prix concurrent est inférieur au prix du produit original
	async findPriceAlerts() {
		const sql = `
      SELECT 
        pcl.*,
        pc.link as competitor_link,
        p.id as product_id,
        p.name as product_name,
        p.price as product_price,
        p.link as product_link,
        (p.price - pcl.price) as price_difference
      FROM product_crawl_logs pcl
      JOIN product_crawls pc ON pcl.product_crawl_id = pc.id
      JOIN products p ON pc.product_id = p.id
      WHERE pcl.price IS NOT NULL AND pcl.price < p.price
      ORDER BY pcl.created_at DESC
    `;

		const alerts = await db.query(sql);

		// Convertir les chaînes JSON en objets
		return alerts.map((alert) => ({
			...alert,
			data: JSON.parse(alert.data),
		}));
	}
}

module.exports = new ProductCrawlLogRepository();
