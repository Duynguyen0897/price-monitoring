const express = require("express");
const router = express.Router();

const productRoutes = require("./productRoutes");
const crawlRoutes = require("./crawlRoutes");
const reportRoutes = require("./reportRoutes");
const schedulerRoutes = require("./schedulerRoutes");
const searchRoutes = require("./searchRoutes");

router.use("/products", productRoutes);
router.use("/crawls", crawlRoutes);
router.use("/reports", reportRoutes);
router.use("/scheduler", schedulerRoutes);
router.use("/search", searchRoutes);

module.exports = router;
