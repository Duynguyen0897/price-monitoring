const db = require('../config/database');
const ProductCrawl = require('../models/ProductCrawl');
const ProductCrawlLog = require('../models/ProductCrawlLog');

class CrawlRepository {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM product_crawls ORDER BY created_at DESC');
    return rows.map(row => new ProductCrawl(row));
  }

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM product_crawls WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return new ProductCrawl(rows[0]);
  }

  async findByProductId(productId) {
    const [rows] = await db.query('SELECT * FROM product_crawls WHERE product_id = ?', [productId]);
    return rows.map(row => new ProductCrawl(row));
  }

  async create(crawlData) {
    const now = new Date();
    const [result] = await db.query(
      'INSERT INTO product_crawls (product_id, link, competitor_name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
      [crawlData.product_id, crawlData.link, crawlData.competitor_name, now, now]
    );
    return this.findById(result.insertId);
  }

  async update(id, crawlData) {
    const now = new Date();
    await db.query(
      'UPDATE product_crawls SET link = ?, competitor_name = ?, updated_at = ? WHERE id = ?',
      [crawlData.link, crawlData.competitor_name, now, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    await db.query('DELETE FROM product_crawls WHERE id = ?', [id]);
    return true;
  }

  async createLog(logData) {
    const [result] = await db.query(
      'INSERT INTO product_crawl_logs (product_crawl_id, name, sku, price, data, screenshot_path, crawled_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        logData.product_crawl_id,
        logData.name,
        logData.sku,
        logData.price,
        logData.data,
        logData.screenshot_path,
        logData.crawled_at
      ]
    );
    return this.findLogById(result.insertId);
  }

  async findLogById(id) {
    const [rows] = await db.query('SELECT * FROM product_crawl_logs WHERE id = ?', [id]);
    if (rows.length === 0) return null;
    return new ProductCrawlLog(rows[0]);
  }

  async getLogsForCrawl(crawlId) {
    const [rows] = await db.query(
      'SELECT * FROM product_crawl_logs WHERE product_crawl_id = ? ORDER BY crawled_at DESC',
      [crawlId]
    );
    return rows.map(row => new ProductCrawlLog(row));
  }

  async getLatestLogForCrawl(crawlId) {
    const [rows] = await db.query(
      'SELECT * FROM product_crawl_logs WHERE product_crawl_id = ? ORDER BY crawled_at DESC LIMIT 1',
      [crawlId]
    );
    if (rows.length === 0) return null;
    return new ProductCrawlLog(rows[0]);
  }
}

module.exports = new CrawlRepository();