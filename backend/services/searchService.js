const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const geminiService = require("./geminiService");
const logger = require("../utils/logger");

class SearchService {
    constructor() {
        this.searchEngines = {
            google: "https://www.google.com/search?q=",
            shopee: "https://shopee.vn/search?keyword=",
            lazada: "https://www.lazada.vn/catalog/?q=",
        };
    }

    async searchProductOnPlatform(productName, platform = "google", maxResults = 5) {
        const browser = await puppeteer.launch({
            headless: false, // Tạm thời để xem browser hoạt động
            args: [
                "--no-sandbox", 
                "--disable-setuid-sandbox",
                "--disable-blink-features=AutomationControlled",
                "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ],
        });

        try {
            const page = await browser.newPage();
            
            // Set realistic viewport and user agent
            await page.setViewport({ width: 1366, height: 768 });
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

            // Block images and css for faster loading
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if(req.resourceType() == 'stylesheet' || req.resourceType() == 'image'){
                    req.abort();
                } else {
                    req.continue();
                }
            });

            const searchUrl = this.searchEngines[platform] + encodeURIComponent(productName);
            logger.info(`Searching on ${platform}: ${searchUrl}`);
            
            await page.goto(searchUrl, {
                waitUntil: "domcontentloaded",
                timeout: 30000,
            });

            // Wait for results to load
            await page.waitForTimeout(5000);

            // Take screenshot for debugging
            const screenshotsDir = path.join(__dirname, "../../screenshots");
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }
            const debugScreenshot = path.join(screenshotsDir, `debug_${platform}_${Date.now()}.png`);
            await page.screenshot({ path: debugScreenshot, fullPage: true });
            logger.info(`Debug screenshot saved: ${debugScreenshot}`);

            let productLinks = [];

            if (platform === "google") {
                productLinks = await this.extractGoogleResults(page, maxResults, productName);
            } else if (platform === "shopee") {
                productLinks = await this.extractShopeeResults(page, maxResults);
            } else if (platform === "lazada") {
                productLinks = await this.extractLazadaResults(page, maxResults);
            }

            logger.info(`Found ${productLinks.length} results on ${platform}`);
            return productLinks;
        } catch (error) {
            logger.error(`Error searching on ${platform}: ${error.message}`);
            throw error;
        } finally {
            await browser.close();
        }
    }

    async extractGoogleResults(page, maxResults, searchTerm) {
        try {
            // Chờ cho các elements load
            await page.waitForTimeout(3000);

            // Thử nhiều selector khác nhau cho Google results
            const links = await page.evaluate((max, term) => {
                const results = [];
                
                // Thử tất cả các selector có thể cho Google search results
                const selectors = [
                    'div.g a h3', // Standard result titles
                    'div[data-ved] a h3', // Results with data-ved
                    '.g .yuRUbf a h3', // New Google layout
                    '.g .yuRUbf a', // Link elements
                    'div.g > div > div > a', // Alternative structure
                    '.rc .r a', // Older Google structure
                    '#search div.g a[href*="http"]', // Any link in results
                    'a[href*="shopee"]', // Direct platform links
                    'a[href*="lazada"]',
                    'a[href*="tiki"]',
                    'a[href*="sendo"]'
                ];

                for (const selector of selectors) {
                    try {
                        const elements = document.querySelectorAll(selector);
                        console.log(`Selector ${selector}: found ${elements.length} elements`);
                        
                        elements.forEach((element) => {
                            if (results.length >= max) return;
                            
                            let url, title;
                            
                            if (element.tagName === 'H3') {
                                // If it's an H3, get the parent link
                                const link = element.closest('a') || element.parentElement.closest('a');
                                if (link) {
                                    url = link.href;
                                    title = element.textContent.trim();
                                }
                            } else if (element.tagName === 'A') {
                                // If it's a link
                                url = element.href;
                                const h3 = element.querySelector('h3');
                                title = h3 ? h3.textContent.trim() : element.textContent.trim();
                            }

                            if (url && url.startsWith('http') && !url.includes('google.com') && title) {
                                // Check if already added
                                if (!results.find(r => r.url === url)) {
                                    results.push({
                                        url: url,
                                        title: title,
                                        platform: this.detectPlatform(url)
                                    });
                                }
                            }
                        });

                        if (results.length >= max) break;
                    } catch (e) {
                        console.log(`Error with selector ${selector}:`, e.message);
                    }
                }

                // If still no results, try to get any clickable links
                if (results.length === 0) {
                    const allLinks = document.querySelectorAll('a[href]');
                    console.log(`Total links found: ${allLinks.length}`);
                    
                    allLinks.forEach((link, index) => {
                        if (results.length >= max) return;
                        
                        const href = link.href;
                        if (href && href.startsWith('http') && 
                            !href.includes('google.com') && 
                            !href.includes('javascript:') &&
                            !href.includes('mailto:') &&
                            (href.includes(term.toLowerCase()) || 
                             link.textContent.toLowerCase().includes(term.toLowerCase()))) {
                            
                            results.push({
                                url: href,
                                title: link.textContent.trim() || `Result ${index + 1}`,
                                platform: this.detectPlatform(href)
                            });
                        }
                    });
                }

                return results.slice(0, max);
            }, maxResults, searchTerm);

            logger.info(`Google extraction found ${links.length} links`);
            
            // Log first few results for debugging
            links.slice(0, 3).forEach((link, index) => {
                logger.info(`Result ${index + 1}: ${link.title} - ${link.url}`);
            });

            return links;
        } catch (error) {
            logger.error(`Error extracting Google results: ${error.message}`);
            return [];
        }
    }

    async extractShopeeResults(page, maxResults) {
        try {
            await page.waitForSelector('.shopee-search-item-result__item, .col-xs-2-4', { timeout: 10000 });
            
            const links = await page.evaluate((max) => {
                const results = [];
                const selectors = [
                    '.shopee-search-item-result__item a',
                    '.col-xs-2-4 a',
                    '[data-sqe="link"] a',
                    '.item-basic-info a'
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach((link) => {
                        if (results.length >= max) return;
                        
                        if (link.href && link.href.includes('/product/')) {
                            const titleElement = link.querySelector('[data-sqe="name"], .item-name, ._10Wbs-');
                            const title = titleElement ? titleElement.textContent.trim() : 'Shopee Product';
                            
                            let fullUrl = link.href;
                            if (!fullUrl.startsWith('http')) {
                                fullUrl = 'https://shopee.vn' + (fullUrl.startsWith('/') ? fullUrl : '/' + fullUrl);
                            }

                            results.push({
                                url: fullUrl,
                                title: title,
                                platform: 'shopee'
                            });
                        }
                    });
                    
                    if (results.length >= max) break;
                }

                return results.slice(0, max);
            }, maxResults);

            return links;
        } catch (error) {
            logger.error(`Error extracting Shopee results: ${error.message}`);
            return [];
        }
    }

    async extractLazadaResults(page, maxResults) {
        try {
            await page.waitForSelector('[data-qa-locator="product-item"], .gridItem', { timeout: 10000 });
            
            const links = await page.evaluate((max) => {
                const results = [];
                const selectors = [
                    '[data-qa-locator="product-item"] a',
                    '.gridItem a',
                    '.product-item a'
                ];

                for (const selector of selectors) {
                    const elements = document.querySelectorAll(selector);
                    elements.forEach((link) => {
                        if (results.length >= max) return;
                        
                        if (link.href && link.href.includes('/products/')) {
                            const titleElement = link.querySelector('[data-qa-locator="product-name"], .title');
                            const title = titleElement ? titleElement.textContent.trim() : 'Lazada Product';
                            
                            let fullUrl = link.href;
                            if (!fullUrl.startsWith('http')) {
                                fullUrl = 'https:' + fullUrl;
                            }

                            results.push({
                                url: fullUrl,
                                title: title,
                                platform: 'lazada'
                            });
                        }
                    });
                    
                    if (results.length >= max) break;
                }

                return results.slice(0, max);
            }, maxResults);

            return links;
        } catch (error) {
            logger.error(`Error extracting Lazada results: ${error.message}`);
            return [];
        }
    }

    detectPlatform(url) {
        if (url.includes('shopee')) return 'shopee';
        if (url.includes('lazada')) return 'lazada';
        if (url.includes('tiki')) return 'tiki';
        if (url.includes('sendo')) return 'sendo';
        if (url.includes('amazon')) return 'amazon';
        return 'other';
    }

    async crawlProductFromUrl(url, searchQuery) {
        const browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1280, height: 800 });

            logger.info(`Crawling product URL: ${url}`);
            await page.goto(url, {
                waitUntil: "networkidle2",
                timeout: 60000,
            });

            // Wait for page to load completely
            await page.waitForTimeout(5000);

            // Ensure screenshots directory exists
            const screenshotsDir = path.join(__dirname, "../../screenshots");
            if (!fs.existsSync(screenshotsDir)) {
                fs.mkdirSync(screenshotsDir, { recursive: true });
            }

            // Take a screenshot
            const timestamp = new Date().getTime();
            const screenshotPath = path.join(
                screenshotsDir,
                `search_${timestamp}.png`
            );
            await page.screenshot({ path: screenshotPath, fullPage: false });

            // Use Gemini to extract product data from the screenshot
            const geminiResponse = await geminiService.extractProductDataFromImage(screenshotPath);

            return {
                url: url,
                name: geminiResponse.name || "Unknown Product",
                sku: geminiResponse.sku || "Unknown",
                price: parseFloat(geminiResponse.price) || 0,
                platform: this.detectPlatform(url),
                searchQuery: searchQuery,
                data: geminiResponse,
                screenshot_path: screenshotPath,
                crawled_at: new Date(),
            };
        } catch (error) {
            logger.error(`Error crawling product URL: ${error.message}`);
            throw error;
        } finally {
            await browser.close();
        }
    }

    async searchAndCrawlProduct(productName, platforms = ["google"], maxResultsPerPlatform = 3) {
        const allResults = [];

        for (const platform of platforms) {
            try {
                logger.info(`Starting search for "${productName}" on ${platform}`);
                const searchResults = await this.searchProductOnPlatform(productName, platform, maxResultsPerPlatform);
                
                if (searchResults.length === 0) {
                    logger.warn(`No search results found for "${productName}" on ${platform}`);
                    continue;
                }

                for (const result of searchResults) {
                    try {
                        // Add delay between requests
                        await new Promise(resolve => setTimeout(resolve, 3000));
                        
                        logger.info(`Crawling product: ${result.title} - ${result.url}`);
                        const productData = await this.crawlProductFromUrl(result.url, productName);
                        allResults.push({
                            ...productData,
                            searchTitle: result.title,
                        });
                    } catch (crawlError) {
                        logger.error(`Error crawling ${result.url}: ${crawlError.message}`);
                        // Continue with next result even if one fails
                    }
                }
            } catch (searchError) {
                logger.error(`Error searching on ${platform}: ${searchError.message}`);
                // Continue with next platform even if one fails
            }
        }

        logger.info(`Search completed for "${productName}": ${allResults.length} products found`);
        return allResults;
    }

    // Thêm method test để debug
    async testGoogleSearch(productName) {
        const browser = await puppeteer.launch({
            headless: false,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        try {
            const page = await browser.newPage();
            await page.setViewport({ width: 1366, height: 768 });

            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(productName)}`;
            logger.info(`Test search URL: ${searchUrl}`);
            
            await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });
            await page.waitForTimeout(5000);

            // Take screenshot for manual review
            const screenshotPath = path.join(__dirname, "../../screenshots", `test_google_${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            
            // Get page content for analysis
            const content = await page.evaluate(() => {
                return {
                    title: document.title,
                    bodyText: document.body.innerText.substring(0, 500),
                    linkCount: document.querySelectorAll('a').length,
                    h3Count: document.querySelectorAll('h3').length
                };
            });

            logger.info(`Page analysis:`, content);
            logger.info(`Screenshot saved: ${screenshotPath}`);

            // Wait for manual inspection
            await page.waitForTimeout(10000);

        } catch (error) {
            logger.error(`Test search error: ${error.message}`);
        } finally {
            await browser.close();
        }
    }
}

module.exports = new SearchService();