require("dotenv").config();

module.exports = {
	apiKey: process.env.GEMINI_API_KEY,
	model: "gemini-2.5-flash",
};
