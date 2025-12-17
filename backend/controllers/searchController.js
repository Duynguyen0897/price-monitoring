const searchService = require("../services/searchService");
const searchResultRepository = require("../repositories/searchResultRepository");
const logger = require("../utils/logger");

exports.searchProduct = async (req, res) => {
    try {
        const { productName, platforms = ["google"], maxResults = 3 } = req.body;

        if (!productName) {
            return res.status(400).json({ message: "Product name is required" });
        }

        // Start search asynchronously and return immediately
        res.status(202).json({ 
            message: "Search started", 
            productName,
            platforms 
        });

        // Execute search in background
        try {
            const results = await searchService.searchAndCrawlProduct(
                productName, 
                platforms, 
                maxResults
            );

            // Save results to database
            const savedResults = [];
            for (const result of results) {
                try {
                    const saved = await searchResultRepository.create(result);
                    savedResults.push(saved);
                } catch (saveError) {
                    logger.error(`Error saving search result: ${saveError.message}`);
                }
            }

            logger.info(`Search completed for "${productName}": ${savedResults.length} results saved`);
        } catch (searchError) {
            logger.error(`Error during search process: ${searchError.message}`);
        }
    } catch (error) {
        logger.error(`Error starting search: ${error.message}`);
        res.status(500).json({
            message: "Error starting search",
            error: error.message,
        });
    }
};

exports.getSearchResults = async (req, res) => {
    try {
        const { searchQuery } = req.query;
        let results;

        if (searchQuery) {
            results = await searchResultRepository.findBySearchQuery(searchQuery);
        } else {
            results = await searchResultRepository.findAll();
        }

        res.json(results);
    } catch (error) {
        logger.error(`Error getting search results: ${error.message}`);
        res.status(500).json({
            message: "Error fetching search results",
            error: error.message,
        });
    }
};

exports.getSearchHistory = async (req, res) => {
    try {
        const history = await searchResultRepository.getSearchHistory();
        res.json(history);
    } catch (error) {
        logger.error(`Error getting search history: ${error.message}`);
        res.status(500).json({
            message: "Error fetching search history",
            error: error.message,
        });
    }
};

exports.getResultsByPlatform = async (req, res) => {
    try {
        const { platform } = req.params;
        const { limit = 10 } = req.query;
        
        const results = await searchResultRepository.getLatestByPlatform(platform, parseInt(limit));
        res.json(results);
    } catch (error) {
        logger.error(`Error getting results by platform: ${error.message}`);
        res.status(500).json({
            message: "Error fetching results by platform",
            error: error.message,
        });
    }
};

exports.deleteSearchResult = async (req, res) => {
    try {
        const result = await searchResultRepository.delete(req.params.id);
        res.json({ success: result });
    } catch (error) {
        logger.error(`Error deleting search result: ${error.message}`);
        res.status(500).json({
            message: "Error deleting search result",
            error: error.message,
        });
    }
};