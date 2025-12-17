const app = require("./app");
const { initDatabase } = require("./utils/database");
const logger = require("./utils/logger");
const schedulerService = require("./services/schedulerService");

const PORT = process.env.PORT || 3000;

async function startServer() {
	try {
		// Initialize database
		await initDatabase();

		// Initialize scheduler service
		schedulerService.initialize();

		// Start the server
		app.listen(PORT, () => {
			logger.info(`Server running on port ${PORT}`);
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		logger.error(`Failed to start server: ${error.message}`);
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

startServer();
