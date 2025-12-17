module.exports = {
    async up(pool) {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS search_results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                search_query VARCHAR(255) NOT NULL,
                product_name VARCHAR(255),
                sku VARCHAR(255),
                price DECIMAL(15, 2),
                url VARCHAR(1000) NOT NULL,
                platform VARCHAR(50),
                data JSON,
                screenshot_path VARCHAR(512),
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_search_query (search_query),
                INDEX idx_platform (platform),
                INDEX idx_created_at (created_at)
            )
        `);
    },

    async down(pool) {
        await pool.query("DROP TABLE IF EXISTS search_results");
    }
};