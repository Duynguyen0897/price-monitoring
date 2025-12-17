const express = require("express");
const router = express.Router();
const crawlController = require("../controllers/crawlController");

router.get("/", crawlController.getAllCrawls);
router.get("/product/:productId", crawlController.getCrawlsByProduct);
router.get("/:id", crawlController.getCrawl);
router.post("/", crawlController.createCrawl);
router.put("/:id", crawlController.updateCrawl);
router.delete("/:id", crawlController.deleteCrawl);
router.post("/:id/start", crawlController.startCrawl);
router.get("/:id/logs", crawlController.getCrawlLogs);
router.get("/:id/logs/latest", crawlController.getLatestCrawlLog);
router.post('/start-all', crawlController.startCrawlAll);

module.exports = router;
