const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

// Import routes
const apiRoutes = require("./routes/api");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

// Serve static files (screenshots)
app.use("/screenshots", express.static(path.join(__dirname, "../screenshots")));

// API routes
app.use("/api", apiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		message: "Something went wrong!",
		error:
			process.env.NODE_ENV === "production"
				? "An error occurred"
				: err.message,
	});
});

module.exports = app;
