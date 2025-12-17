const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
const logger = require("./logger");

const migrationDir = path.join(__dirname, "../migrations");

async function initDatabase() {
	const pool = require("../config/database");

	try {
		// Create tables if they don't exist
		await createTables(pool);

		// Run migrations
		await runMigrations(pool);

		logger.info("Database initialization complete");
	} catch (error) {
		logger.error(`Database initialization failed: ${error.message}`);
		throw error;
	}
}

async function createTables(pool) {
	// Products table
	await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      link VARCHAR(512) NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL
    )
  `);

	// Product crawls table
	await pool.query(`
    CREATE TABLE IF NOT EXISTS product_crawls (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_id INT NOT NULL,
      link VARCHAR(512) NOT NULL,
      competitor_name VARCHAR(255),
      created_at DATETIME NOT NULL,
      updated_at DATETIME NOT NULL,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    )
  `);

	// Product crawl logs table
	await pool.query(`
    CREATE TABLE IF NOT EXISTS product_crawl_logs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_crawl_id INT NOT NULL,
      name VARCHAR(255),
      sku VARCHAR(255),
      price DECIMAL(10, 2),
      data JSON,
      screenshot_path VARCHAR(512),
      crawled_at DATETIME NOT NULL,
      FOREIGN KEY (product_crawl_id) REFERENCES product_crawls(id) ON DELETE CASCADE
    )
  `);

	logger.info("Database tables created");
}

async function runMigrations(pool) {
	// If migrations directory doesn't exist, return
	if (!fs.existsSync(migrationDir)) {
		logger.info("No migrations directory found");
		return;
	}

	// Create migrations table if it doesn't exist
	await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      executed_at DATETIME NOT NULL
    )
  `);

	// Get list of executed migrations
	const [executedMigrations] = await pool.query(
		"SELECT name FROM migrations"
	);
	const executedMigrationNames = executedMigrations.map((row) => row.name);

	// Get all migration files
	const migrationFiles = fs
		.readdirSync(migrationDir)
		.filter((file) => file.endsWith(".js"))
		.sort();

	// Execute migrations that haven't been run yet
	for (const migrationFile of migrationFiles) {
		if (!executedMigrationNames.includes(migrationFile)) {
			logger.info(`Running migration: ${migrationFile}`);

			const migration = require(path.join(migrationDir, migrationFile));
			await migration.up(pool);

			// Mark migration as executed
			await pool.query(
				"INSERT INTO migrations (name, executed_at) VALUES (?, ?)",
				[migrationFile, new Date()]
			);

			logger.info(`Completed migration: ${migrationFile}`);
		}
	}
}

module.exports = { initDatabase };
