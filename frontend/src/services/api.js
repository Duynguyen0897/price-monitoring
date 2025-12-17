import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Products
export const getProducts = () => api.get("/products");
export const getProduct = (id) => api.get(`/products/${id}`);
export const createProduct = (data) => api.post("/products", data);
export const updateProduct = (id, data) => api.put(`/products/${id}`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}`);

// Crawls
export const getCrawls = () => api.get("/crawls");
export const getCrawlsByProduct = (productId) =>
    api.get(`/crawls/product/${productId}`);
export const getCrawl = (id) => api.get(`/crawls/${id}`);
export const createCrawl = (data) => api.post("/crawls", data);
export const updateCrawl = (id, data) => api.put(`/crawls/${id}`, data);
export const deleteCrawl = (id) => api.delete(`/crawls/${id}`);
export const startCrawl = (id) => api.post(`/crawls/${id}/start`);
export const getCrawlLogs = (id) => api.get(`/crawls/${id}/logs`);
export const getLatestCrawlLog = (id) => api.get(`/crawls/${id}/logs/latest`);
export const startCrawlAll = (productId = null) => api.post(`/crawls/start-all${productId ? `?productId=${productId}` : ''}`);

// Search Products
export const searchProduct = (data) => api.post("/search", data);
export const getSearchResults = (searchQuery = null) => 
    api.get(`/search/results${searchQuery ? `?searchQuery=${searchQuery}` : ''}`);
export const getSearchHistory = () => api.get("/search/history");
export const getSearchResultsByPlatform = (platform, limit = 10) => 
    api.get(`/search/platform/${platform}?limit=${limit}`);
export const deleteSearchResult = (id) => api.delete(`/search/${id}`);

// Reports
export const getProductPriceComparison = (productId) =>
    api.get(`/reports/comparisons/${productId}`);
export const getPriceAlerts = () => api.get("/reports/alerts");
export const getProductPriceAlerts = (productId) =>
    api.get(`/reports/alerts/product/${productId}`);
export const getAllPriceAlerts = () => api.get("/reports/alerts/all");

export default api;
