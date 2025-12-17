import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Button,
	TextField,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	IconButton,
	CircularProgress,
	Alert,
	Snackbar,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Chip,
	Stack,
	Tooltip,
} from "@mui/material";
import {
	Add as AddIcon,
	Delete as DeleteIcon,
	Edit as EditIcon,
	PlayArrow as StartIcon,
	Update as UpdateIcon,
	Refresh as RefreshAllIcon,
} from "@mui/icons-material";
import {
	getCrawls,
	getCrawlsByProduct,
	createCrawl,
	updateCrawl,
	deleteCrawl,
	startCrawl,
	startCrawlAll,
	getProducts,
	getLatestCrawlLog,
} from "../services/api";

function Competitors() {
	const [crawls, setCrawls] = useState([]);
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [open, setOpen] = useState(false);
	const [editMode, setEditMode] = useState(false);
	const [currentCrawl, setCurrentCrawl] = useState(null);
	const [selectedProduct, setSelectedProduct] = useState("");
	const [formData, setFormData] = useState({
		product_id: "",
		competitor_name: "",
		link: "",
	});
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});
	const [crawlStatuses, setCrawlStatuses] = useState({});
	const [refreshingCrawl, setRefreshingCrawl] = useState(false);
	const [globalCrawlInProgress, setGlobalCrawlInProgress] = useState(false);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			setLoading(true);
			const [crawlsResponse, productsResponse] = await Promise.all([
				getCrawls(),
				getProducts(),
			]);
			setCrawls(crawlsResponse.data);
			setProducts(productsResponse.data);

			// Fetch latest log for each crawl
			const crawlIds = crawlsResponse.data.map((crawl) => crawl.id);
			fetchCrawlStatuses(crawlIds);

			setLoading(false);
		} catch (err) {
			console.error("Error fetching data:", err);
			setError("Failed to load data. Please try again.");
			setLoading(false);
		}
	};

	const fetchCrawlStatuses = async (crawlIds) => {
		const statuses = {};

		for (const id of crawlIds) {
			try {
				const response = await getLatestCrawlLog(id);
				if (response.data) {
					statuses[id] = {
						price: parseFloat(response.data.price).toLocaleString(
							"vi-VN",
							{ maximumFractionDigits: 0 }
						),
						name: response.data.name,
						crawled_at: new Date(
							response.data.crawled_at
						).toLocaleString(),
						hasData: true,
					};
				} else {
					statuses[id] = { hasData: false };
				}
			} catch (err) {
				console.error(`Error fetching status for crawl ${id}:`, err);
				statuses[id] = { error: true, hasData: false };
			}
		}

		setCrawlStatuses(statuses);
	};

	const handleFilterByProduct = async (productId) => {
		try {
			setLoading(true);
			setSelectedProduct(productId);

			let crawlsData;
			if (productId) {
				const response = await getCrawlsByProduct(productId);
				crawlsData = response.data;
			} else {
				const response = await getCrawls();
				crawlsData = response.data;
			}

			setCrawls(crawlsData);

			// Fetch latest log for each crawl
			const crawlIds = crawlsData.map((crawl) => crawl.id);
			fetchCrawlStatuses(crawlIds);

			setLoading(false);
		} catch (err) {
			console.error("Error filtering crawls:", err);
			setError("Failed to filter crawls. Please try again.");
			setLoading(false);
		}
	};

	const handleOpen = () => {
		setFormData({
			product_id: selectedProduct || "",
			competitor_name: "",
			link: "",
		});
		setEditMode(false);
		setOpen(true);
	};

	const handleEditOpen = (crawl) => {
		setFormData({
			product_id: crawl.product_id,
			competitor_name: crawl.competitor_name || "",
			link: crawl.link,
		});
		setCurrentCrawl(crawl);
		setEditMode(true);
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = async () => {
		try {
			// Validate form data
			if (!formData.product_id || !formData.link) {
				setSnackbar({
					open: true,
					message: "Product and link are required",
					severity: "error",
				});
				return;
			}

			if (editMode && currentCrawl) {
				await updateCrawl(currentCrawl.id, formData);
				setSnackbar({
					open: true,
					message: "Competitor product updated successfully",
					severity: "success",
				});
			} else {
				await createCrawl(formData);
				setSnackbar({
					open: true,
					message: "Competitor product added successfully",
					severity: "success",
				});
			}

			setOpen(false);
			fetchData();
		} catch (err) {
			console.error("Error saving competitor:", err);
			setSnackbar({
				open: true,
				message: `Error: ${
					err.response?.data?.message ||
					"Failed to save competitor product"
				}`,
				severity: "error",
			});
		}
	};

	const handleDelete = async (id) => {
		if (
			!window.confirm(
				"Are you sure you want to delete this competitor product?"
			)
		) {
			return;
		}

		try {
			await deleteCrawl(id);
			setSnackbar({
				open: true,
				message: "Competitor product deleted successfully",
				severity: "success",
			});
			fetchData();
		} catch (err) {
			console.error("Error deleting competitor:", err);
			setSnackbar({
				open: true,
				message: `Error: ${
					err.response?.data?.message ||
					"Failed to delete competitor product"
				}`,
				severity: "error",
			});
		}
	};

	const handleStartCrawl = async (id) => {
		try {
			setRefreshingCrawl(id);
			await startCrawl(id);

			setSnackbar({
				open: true,
				message: "Crawl started successfully. This may take a minute.",
				severity: "info",
			});

			// Poll for updates every 3 seconds for up to 30 seconds
			let attempts = 0;
			const maxAttempts = 10;

			const pollInterval = setInterval(async () => {
				attempts++;
				try {
					const response = await getLatestCrawlLog(id);
					if (
						response.data &&
						new Date(response.data.crawled_at) >
							new Date(Date.now() - 60000)
					) {
						// If we got fresh data less than 1 minute old
						clearInterval(pollInterval);
						setRefreshingCrawl(false);

						// Update just this one crawl status
						setCrawlStatuses((prev) => ({
							...prev,
							[id]: {
								price: response.data.price,
								crawled_at: new Date(
									response.data.crawled_at
								).toLocaleString(),
								hasData: true,
							},
						}));

						setSnackbar({
							open: true,
							message: "Price updated successfully",
							severity: "success",
						});
					}

					if (attempts >= maxAttempts) {
						clearInterval(pollInterval);
						setRefreshingCrawl(false);

						setSnackbar({
							open: true,
							message:
								"Crawl may still be in progress. Check back later.",
							severity: "warning",
						});
					}
				} catch (err) {
					console.error("Error polling for crawl update:", err);
					if (attempts >= maxAttempts) {
						clearInterval(pollInterval);
						setRefreshingCrawl(false);

						setSnackbar({
							open: true,
							message:
								"Unable to verify crawl completion. Check back later.",
							severity: "warning",
						});
					}
				}
			}, 3000);
		} catch (err) {
			console.error("Error starting crawl:", err);
			setRefreshingCrawl(false);
			setSnackbar({
				open: true,
				message: `Error: ${
					err.response?.data?.message || "Failed to start crawl"
				}`,
				severity: "error",
			});
		}
	};

	// New handler for crawling all products
	const handleStartCrawlAll = async () => {
		try {
			setGlobalCrawlInProgress(true);

			const response = await startCrawlAll(selectedProduct);

			setSnackbar({
				open: true,
				message: `Started crawling ${response.data.count} competitor products. This may take several minutes.`,
				severity: "info",
			});

			// Wait 10 seconds before allowing another global crawl
			setTimeout(() => {
				setGlobalCrawlInProgress(false);
			}, 10000);

			// Poll for updates every 10 seconds for up to 2 minutes
			let attempts = 0;
			const maxAttempts = 12;

			const pollInterval = setInterval(async () => {
				attempts++;
				try {
					// Refetch all crawl statuses
					const currentCrawlIds = crawls.map((crawl) => crawl.id);
					await fetchCrawlStatuses(currentCrawlIds);

					if (attempts >= maxAttempts) {
						clearInterval(pollInterval);

						setSnackbar({
							open: true,
							message:
								"Refreshed crawler data. Some crawls may still be in progress.",
							severity: "info",
						});
					}
				} catch (err) {
					console.error(
						"Error polling for global crawl updates:",
						err
					);
					if (attempts >= maxAttempts) {
						clearInterval(pollInterval);
					}
				}
			}, 10000);
		} catch (err) {
			console.error("Error starting global crawl:", err);
			setGlobalCrawlInProgress(false);
			setSnackbar({
				open: true,
				message: `Error: ${
					err.response?.data?.message ||
					"Failed to start global crawl"
				}`,
				severity: "error",
			});
		}
	};

	const handleCloseSnackbar = (event, reason) => {
		if (reason === "clickaway") {
			return;
		}
		setSnackbar({ ...snackbar, open: false });
	};

	const getProductName = (productId) => {
		const product = products.find((p) => p.id === productId);
		return product ? product.name : "Unknown Product";
	};

	if (loading && !refreshingCrawl && !globalCrawlInProgress) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 3,
				}}
			>
				<Typography variant="h4">Competitor Products</Typography>
				<Stack direction="row" spacing={2}>
					<Tooltip
						title={
							selectedProduct
								? "Crawl all products for the selected product"
								: "Crawl all competitor products"
						}
					>
						<span>
							<Button
								variant="outlined"
								color="primary"
								startIcon={
									globalCrawlInProgress ? (
										<CircularProgress size={20} />
									) : (
										<RefreshAllIcon />
									)
								}
								onClick={handleStartCrawlAll}
								disabled={
									globalCrawlInProgress || crawls.length === 0
								}
							>
								{selectedProduct
									? "Crawl All for Selected Product"
									: "Crawl All Products"}
							</Button>
						</span>
					</Tooltip>
					<Button
						variant="contained"
						color="primary"
						startIcon={<AddIcon />}
						onClick={handleOpen}
					>
						Add Competitor Product
					</Button>
				</Stack>
			</Box>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{/* Filter by product */}
			<Box sx={{ mb: 3 }}>
				<FormControl sx={{ minWidth: 300 }}>
					<InputLabel id="product-filter-label">
						Filter by Product
					</InputLabel>
					<Select
						labelId="product-filter-label"
						value={selectedProduct}
						label="Filter by Product"
						onChange={(e) => handleFilterByProduct(e.target.value)}
					>
						<MenuItem value="">
							<em>All Products</em>
						</MenuItem>
						{products.map((product) => (
							<MenuItem key={product.id} value={product.id}>
								{product.name}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Box>

			{globalCrawlInProgress && (
				<Alert severity="info" sx={{ mb: 2 }}>
					Crawling in progress... This may take several minutes. You
					can continue using the application.
				</Alert>
			)}

			{/* Competitor Products List */}
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Product</TableCell>
							<TableCell>Competitor</TableCell>
							<TableCell>Link</TableCell>
							<TableCell>Latest Price</TableCell>
							<TableCell>Last Updated</TableCell>
							<TableCell align="right">Actions</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{crawls.length === 0 ? (
							<TableRow>
								<TableCell colSpan={6} align="center">
									No competitor products found. Add one to get
									started.
								</TableCell>
							</TableRow>
						) : (
							crawls.map((crawl) => (
								<TableRow key={crawl.id}>
									<TableCell>
										{getProductName(crawl.product_id)}
									</TableCell>
									<TableCell>
										{crawlStatuses[crawl.id]?.name ||
											crawl.competitor_name ||
											"Unnamed Competitor"}
									</TableCell>
									<TableCell>
										<a
											href={crawl.link}
											target="_blank"
											rel="noopener noreferrer"
										>
											{crawl.link.length > 30
												? `${crawl.link.substring(
														0,
														30
												  )}...`
												: crawl.link}
										</a>
									</TableCell>
									<TableCell>
										{crawlStatuses[crawl.id]?.hasData ? (
											`${crawlStatuses[crawl.id].price}đ`
										) : (
											<Chip
												label="Not crawled yet"
												size="small"
												color="warning"
											/>
										)}
									</TableCell>
									<TableCell>
										{crawlStatuses[crawl.id]?.hasData
											? crawlStatuses[crawl.id].crawled_at
											: "-"}
									</TableCell>
									<TableCell align="right">
										<IconButton
											color="primary"
											onClick={() =>
												handleStartCrawl(crawl.id)
											}
											disabled={
												refreshingCrawl === crawl.id ||
												globalCrawlInProgress
											}
										>
											{refreshingCrawl === crawl.id ? (
												<CircularProgress size={24} />
											) : crawlStatuses[crawl.id]
													?.hasData ? (
												<UpdateIcon />
											) : (
												<StartIcon />
											)}
										</IconButton>
										<IconButton
											color="primary"
											onClick={() =>
												handleEditOpen(crawl)
											}
										>
											<EditIcon />
										</IconButton>
										<IconButton
											color="error"
											onClick={() =>
												handleDelete(crawl.id)
											}
										>
											<DeleteIcon />
										</IconButton>
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Add/Edit Competitor Dialog */}
			<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
				<DialogTitle>
					{editMode
						? "Edit Competitor Product"
						: "Add Competitor Product"}
				</DialogTitle>
				<DialogContent>
					<FormControl fullWidth margin="dense" sx={{ mb: 2 }}>
						<InputLabel id="product-select-label">
							Product
						</InputLabel>
						<Select
							labelId="product-select-label"
							name="product_id"
							value={formData.product_id}
							label="Product"
							onChange={handleChange}
						>
							<MenuItem value="">
								<em>Select a product</em>
							</MenuItem>
							{products.map((product) => (
								<MenuItem key={product.id} value={product.id}>
									{product.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					<TextField
						margin="dense"
						name="competitor_name"
						label="Competitor Name"
						type="text"
						fullWidth
						value={formData.competitor_name}
						onChange={handleChange}
						sx={{ mb: 2 }}
					/>

					<TextField
						margin="dense"
						name="link"
						label="Competitor Product Link"
						type="url"
						fullWidth
						value={formData.link}
						onChange={handleChange}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose} color="primary">
						Cancel
					</Button>
					<Button
						onClick={handleSubmit}
						color="primary"
						variant="contained"
					>
						{editMode ? "Update" : "Add"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Snackbar for notifications */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={handleCloseSnackbar}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					onClose={handleCloseSnackbar}
					severity={snackbar.severity}
					sx={{ width: "100%" }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
}

export default Competitors;
