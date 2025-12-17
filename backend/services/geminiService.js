const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs").promises;
const logger = require("../utils/logger");
const { env } = require("process");

class GeminiService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // this.model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    }

    async init() {
        try {
            const models = await this.genAI.listModels();
            console.log("Available Gemini models:", models);
        } catch (error) {
            logger.error("Error initializing GeminiService:", error.message);
        }
    }

    async extractProductDataFromImage(imagePath) {

        this.init();
        try {
            logger.info(`Extracting product data from image: ${imagePath}`);
            
            const imageData = await fs.readFile(imagePath);
            const base64Image = imageData.toString('base64');

            const prompt = `
            Analyze this product page screenshot and extract the following information in JSON format:
            
            {
                "name": "product name",
                "sku": "product model/SKU if visible",
                "price": "numerical price value only (no currency symbols)",
                "currency": "currency symbol or code",
                "availability": "in stock/out of stock/unknown",
                "seller": "seller name if visible",
                "description": "brief product description",
                "specifications": "key specifications if visible",
                "images_count": "number of product images visible",
                "rating": "product rating if visible",
                "reviews_count": "number of reviews if visible"
            }
            
            Important rules:
            - Extract only the main product price (not shipping, tax, etc.)
            - For price, return only numbers (e.g., "299000" not "299,000₫")
            - If information is not visible, use "unknown" or null
            - Be accurate and conservative in extraction
            - Focus on the primary product being displayed
            `;

            const result = await this.model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: base64Image,
                        mimeType: "image/png",
                    },
                },
            ]);

            const response = await result.response;
            const text = response.text();
            
            logger.info(`Gemini response: ${text}`);

            // Parse JSON response
            try {
                const cleanedResponse = text.replace(/```json\n?|\n?```/g, '').trim();
                const productData = JSON.parse(cleanedResponse);
                
                // Validate and clean the data
                return {
                    name: productData.name || "Unknown Product",
                    sku: productData.sku || "Unknown",
                    price: this.parsePrice(productData.price),
                    currency: productData.currency || "VND",
                    availability: productData.availability || "unknown",
                    seller: productData.seller || "unknown",
                    description: productData.description || "unknown",
                    specifications: productData.specifications || "unknown",
                    rating: productData.rating || null,
                    reviews_count: productData.reviews_count || null,
                    raw_response: text
                };
            } catch (parseError) {
                logger.error(`Error parsing Gemini JSON response: ${parseError.message}`);
                
                // Fallback: try to extract basic info from text
                return this.extractBasicInfoFromText(text);
            }

        } catch (error) {
            logger.error(`Error calling Gemini API: ${error.message}`);
            return {
                name: "Error extracting data",
                sku: "unknown",
                price: 0,
                currency: "VND",
                availability: "unknown",
                seller: "unknown",
                description: `Error: ${error.message}`,
                error: error.message
            };
        }
    }

    parsePrice(priceText) {
        if (!priceText) return 0;
        
        // Remove all non-digit characters except dots and commas
        const cleanPrice = priceText.toString().replace(/[^\d.,]/g, '');
        
        // Handle different number formats
        if (cleanPrice.includes('.') && cleanPrice.includes(',')) {
            // Assume comma is thousands separator, dot is decimal
            const withoutCommas = cleanPrice.replace(/,/g, '');
            return parseFloat(withoutCommas) || 0;
        } else if (cleanPrice.includes(',')) {
            // Could be thousands separator or decimal separator
            const parts = cleanPrice.split(',');
            if (parts.length === 2 && parts[1].length <= 2) {
                // Likely decimal separator
                return parseFloat(cleanPrice.replace(',', '.')) || 0;
            } else {
                // Likely thousands separator
                return parseFloat(cleanPrice.replace(/,/g, '')) || 0;
            }
        }
        
        return parseFloat(cleanPrice) || 0;
    }

    extractBasicInfoFromText(text) {
        // Simple text extraction as fallback
        const priceMatch = text.match(/\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?/);
        const price = priceMatch ? this.parsePrice(priceMatch[0]) : 0;
        
        return {
            name: "Product from page",
            sku: "unknown",
            price: price,
            currency: "VND",
            availability: "unknown",
            seller: "unknown",
            description: text.substring(0, 200),
            raw_response: text
        };
    }

    async testImageExtraction(imagePath) {
        logger.info(`Testing image extraction on: ${imagePath}`);
        const result = await this.extractProductDataFromImage(imagePath);
        logger.info(`Test result:`, result);
        return result;
    }
}

module.exports = new GeminiService();
