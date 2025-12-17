const db = require("../config/database");

class SearchResultRepository {
    async create(searchData) {
        const now = new Date();
        const [result] = await db.query(
            `INSERT INTO search_results 
            (search_query, product_name, sku, price, url, platform, data, screenshot_path, created_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                searchData.searchQuery,
                searchData.name,
                searchData.sku,
                searchData.price,
                searchData.url,
                searchData.platform,
                JSON.stringify(searchData.data),
                searchData.screenshot_path,
                now
            ]
        );
        return this.findById(result.insertId);
    }

    async findById(id) {
        const [rows] = await db.query("SELECT * FROM search_results WHERE id = ?", [id]);
        if (rows.length === 0) return null;
        const row = rows[0];
        return {
            ...row,
            data: JSON.parse(row.data)
        };
    }

    async findBySearchQuery(searchQuery) {
        const [rows] = await db.query(
            "SELECT * FROM search_results WHERE search_query = ? ORDER BY created_at DESC",
            [searchQuery]
        );
        return rows.map(row => ({
            ...row,
            data: JSON.parse(row.data)
        }));
    }

    async findAll(limit = 50) {
        const [rows] = await db.query(
            "SELECT * FROM search_results ORDER BY created_at DESC LIMIT ?",
            [limit]
        );
        return rows.map(row => ({
            ...row,
            data: JSON.parse(row.data)
        }));
    }

    async delete(id) {
        await db.query("DELETE FROM search_results WHERE id = ?", [id]);
        return true;
    }

    async getLatestByPlatform(platform, limit = 10) {
        const [rows] = await db.query(
            "SELECT * FROM search_results WHERE platform = ? ORDER BY created_at DESC LIMIT ?",
            [platform, limit]
        );
        return rows.map(row => ({
            ...row,
            data: JSON.parse(row.data)
        }));
    }

    async getSearchHistory() {
        const [rows] = await db.query(
            `SELECT search_query, COUNT(*) as result_count, MAX(created_at) as last_search 
            FROM search_results 
            GROUP BY search_query 
            ORDER BY last_search DESC`
        );
        return rows;
    }
}

module.exports = new SearchResultRepository();