// server/services/productService.js
const productRepository = require("../repositories/productRepository");
const productCrawlRepository = require("../repositories/crawlRepository");
const productCrawlLogRepository = require("../repositories/productCrawlLogRepository");
const crawlerService = require("./crawlerService");

class ProductService {
	// Créer un nouveau produit avec ses liens concurrents
	async createProductWithCompetitorLinks(productData, competitorLinks) {
		try {
			// 1. Créer le produit original
			const product = await productRepository.create({
				name: productData.name || "Produit sans nom",
				price: productData.price || 0,
				link: productData.link,
			});

			// 2. Créer les liens des concurrents
			const createdLinks = [];

			for (const link of competitorLinks) {
				const productCrawl = await productCrawlRepository.create({
					product_id: product.id,
					link,
				});

				createdLinks.push(productCrawl);
			}

			return {
				product,
				competitorLinks: createdLinks,
			};
		} catch (error) {
			console.error(
				"Error creating product with competitor links:",
				error
			);
			throw error;
		}
	}

	// Mettre à jour un produit et ses liens concurrents
	async updateProductWithCompetitorLinks(
		productId,
		productData,
		competitorLinks
	) {
		try {
			// 1. Mettre à jour le produit original
			const product = await productRepository.update(productId, {
				name: productData.name,
				price: productData.price,
				link: productData.link,
			});

			// 2. Supprimer les anciens liens
			await productCrawlRepository.deleteByProductId(productId);

			// 3. Créer les nouveaux liens des concurrents
			const createdLinks = [];

			for (const link of competitorLinks) {
				const productCrawl = await productCrawlRepository.create({
					product_id: productId,
					link,
				});

				createdLinks.push(productCrawl);
			}

			return {
				product,
				competitorLinks: createdLinks,
			};
		} catch (error) {
			console.error(
				"Error updating product with competitor links:",
				error
			);
			throw error;
		}
	}

	// Obtenir un produit avec ses liens concurrents
	async getProductWithCompetitorLinks(productId) {
		try {
			// 1. Récupérer le produit
			const product = await productRepository.findById(productId);

			if (!product) {
				return null;
			}

			// 2. Récupérer les liens des concurrents
			const competitorLinks =
				await productCrawlRepository.findByProductId(productId);

			return {
				product,
				competitorLinks,
			};
		} catch (error) {
			console.error(
				"Error getting product with competitor links:",
				error
			);
			throw error;
		}
	}

	// Obtenir tous les produits avec leurs liens concurrents
	async getAllProductsWithCompetitorLinks() {
		try {
			// 1. Récupérer tous les produits
			const products = await productRepository.findAll();

			// 2. Pour chaque produit, récupérer ses liens concurrents
			const result = [];

			for (const product of products) {
				const competitorLinks =
					await productCrawlRepository.findByProductId(product.id);
				result.push({
					product,
					competitorLinks,
				});
			}

			return result;
		} catch (error) {
			console.error(
				"Error getting all products with competitor links:",
				error
			);
			throw error;
		}
	}

	// Exécuter le crawling pour un produit
	async crawlProductCompetitors(productId) {
		try {
			// 1. Récupérer le produit et ses liens concurrents
			const { product, competitorLinks } =
				await this.getProductWithCompetitorLinks(productId);

			if (!product || !competitorLinks || competitorLinks.length === 0) {
				return {
					success: false,
					message: "Product or competitor links not found",
				};
			}

			// 2. Exécuter le crawling pour tous les liens concurrents
			const crawlResults =
				await crawlerService.crawlAllCompetitorProducts(
					productId,
					competitorLinks
				);

			return {
				success: true,
				product,
				competitorLinks,
				crawlResults,
			};
		} catch (error) {
			console.error("Error crawling product competitors:", error);
			return {
				success: false,
				error: error.message,
			};
		}
	}

	// Obtenir l'historique de crawling pour un produit
	async getProductCrawlHistory(productId) {
		try {
			// 1. Récupérer le produit
			const product = await productRepository.findById(productId);

			if (!product) {
				return null;
			}

			// 2. Récupérer les liens des concurrents
			const competitorLinks =
				await productCrawlRepository.findByProductId(productId);

			// 3. Pour chaque lien concurrent, récupérer son historique de crawl
			const history = [];

			for (const link of competitorLinks) {
				const logs =
					await productCrawlLogRepository.findByProductCrawlId(
						link.id
					);
				history.push({
					competitorLink: link,
					logs,
				});
			}

			return {
				product,
				history,
			};
		} catch (error) {
			console.error("Error getting product crawl history:", error);
			throw error;
		}
	}

	// Supprimer un produit et toutes ses données associées
	async deleteProduct(productId) {
		try {
			// La suppression en cascade supprimera automatiquement les liens concurrents
			// et les logs grâce aux contraintes de clé étrangère
			await productRepository.delete(productId);

			return {
				success: true,
				productId,
			};
		} catch (error) {
			console.error("Error deleting product:", error);
			throw error;
		}
	}
}

module.exports = new ProductService();
