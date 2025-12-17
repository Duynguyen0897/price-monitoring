const db = require("../config/database");
const Product = require("../models/Product");

class ProductRepository {
	async findAll() {
		const [rows] = await db.query(
			"SELECT * FROM products ORDER BY created_at DESC"
		);
		return rows.map((row) => new Product(row));
	}

	async findById(id) {
		const [rows] = await db.query("SELECT * FROM products WHERE id = ?", [
			id,
		]);
		if (rows.length === 0) return null;
		return new Product(rows[0]);
	}

	async create(productData) {
		const now = new Date();
		const [result] = await db.query(
			"INSERT INTO products (name, price, link, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
			[productData.name, productData.price, productData.link, now, now]
		);
		return this.findById(result.insertId);
	}

	async update(id, productData) {
		const now = new Date();
		await db.query(
			"UPDATE products SET name = ?, price = ?, link = ?, updated_at = ? WHERE id = ?",
			[productData.name, productData.price, productData.link, now, id]
		);
		return this.findById(id);
	}

	async delete(id) {
		await db.query("DELETE FROM products WHERE id = ?", [id]);
		return true;
	}
}

module.exports = new ProductRepository();
