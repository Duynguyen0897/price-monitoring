const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");
const searchService = require("../services/searchService");

router.post("/", searchController.searchProduct);
router.get("/results", searchController.getSearchResults);
router.get("/history", searchController.getSearchHistory);
router.get("/platform/:platform", searchController.getResultsByPlatform);
router.delete("/:id", searchController.deleteSearchResult);

// Test route để debug
router.get("/test/:productName", async (req, res) => {
    try {
        await searchService.testGoogleSearch(req.params.productName);
        res.json({ message: "Test completed, check logs and screenshots" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;