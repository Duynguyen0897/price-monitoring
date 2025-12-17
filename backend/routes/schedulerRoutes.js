const express = require('express');
const router = express.Router();
const schedulerController = require('../controllers/schedulerController');

router.get('/status', schedulerController.getSchedulerStatus);
router.post('/crawl/trigger', schedulerController.triggerGlobalCrawl);
router.post('/crawl/schedule', schedulerController.updateGlobalCrawlSchedule);

module.exports = router;