const productRepository = require("../repositories/productRepository");
const logger = require("../utils/logger");

exports.getAllProducts = async (req, res) => {
	try {
		const products = await productRepository.findAll();
		res.json(products);
	} catch (error) {
		logger.error(`Error getting products: ${error.message}`);
		res.status(500).json({
			message: "Error fetching products",
			error: error.message,
		});
	}
};

exports.getProduct = async (req, res) => {
	try {
		const product = await productRepository.findById(req.params.id);
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}
		res.json(product);
	} catch (error) {
		logger.error(`Error getting product: ${error.message}`);
		res.status(500).json({
			message: "Error fetching product",
			error: error.message,
		});
	}
};

exports.createProduct = async (req, res) => {
	try {
		const { name, price, link } = req.body;

		if (!name || !price || !link) {
			return res
				.status(400)
				.json({ message: "Name, price, and link are required" });
		}

		const product = await productRepository.create({ name, price, link });
		res.status(201).json(product);
	} catch (error) {
		logger.error(`Error creating product: ${error.message}`);
		res.status(500).json({
			message: "Error creating product",
			error: error.message,
		});
	}
};

exports.updateProduct = async (req, res) => {
	try {
		const { name, price, link } = req.body;
		const product = await productRepository.update(req.params.id, {
			name,
			price,
			link,
		});
		if (!product) {
			return res.status(404).json({ message: "Product not found" });
		}
		res.json(product);
	} catch (error) {
		logger.error(`Error updating product: ${error.message}`);
		res.status(500).json({
			message: "Error updating product",
			error: error.message,
		});
	}
};

exports.deleteProduct = async (req, res) => {
	try {
		const result = await productRepository.delete(req.params.id);
		res.json({ success: result });
	} catch (error) {
		logger.error(`Error deleting product: ${error.message}`);
		res.status(500).json({
			message: "Error deleting product",
			error: error.message,
		});
	}
};
