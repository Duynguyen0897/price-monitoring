import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	CircularProgress,
	Alert,
	Card,
	CardContent,
	Grid,
	Chip,
} from "@mui/material";
import { getAllPriceAlerts, getProducts } from "../services/api";

function Reports() {
	const [alerts, setAlerts] = useState([]);
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			setLoading(true);
			const [alertsResponse, productsResponse] = await Promise.all([
				getAllPriceAlerts(),
				getProducts(),
			]);

            console.log(alertsResponse)

			setAlerts(alertsResponse.data);
			setProducts(productsResponse.data);
			setLoading(false);
		} catch (err) {
			console.error("Error fetching alerts:", err);
			setError("Failed to load price alerts. Please try again.");
			setLoading(false);
		}
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleString();
	};

	const getSeverityColor = (percentage) => {
		if (percentage > 20) return "error";
		if (percentage > 10) return "warning";
		return "info";
	};

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				Price Alerts
			</Typography>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			<Box sx={{ mb: 4 }}>
				<Card>
					<CardContent>
						<Typography variant="h6" gutterBottom>
							Summary
						</Typography>
						<Grid container spacing={3}>
							<Grid item xs={12} sm={4}>
								<Typography variant="body1">
									Products Monitored:{" "}
									<strong>{products.length}</strong>
								</Typography>
							</Grid>
							<Grid item xs={12} sm={4}>
								<Typography variant="body1">
									Price Alerts Found:{" "}
									<strong>{alerts.length}</strong>
								</Typography>
							</Grid>
							<Grid item xs={12} sm={4}>
								<Typography variant="body1">
									Products with Alerts:{" "}
									<strong>
										{
											new Set(
												alerts.map((a) => a.product_id)
											).size
										}
									</strong>
								</Typography>
							</Grid>
						</Grid>
					</CardContent>
				</Card>
			</Box>

			{alerts.length === 0 ? (
				<Alert severity="info">
					No price alerts found. Your products are competitively
					priced or no crawler data is available yet.
				</Alert>
			) : (
				<TableContainer component={Paper}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Your Product</TableCell>
								<TableCell>Your Price</TableCell>
								<TableCell>Competitor</TableCell>
								<TableCell>Competitor Price</TableCell>
								<TableCell>Difference</TableCell>
								<TableCell>% Difference</TableCell>
								<TableCell>Last Updated</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{alerts.map((alert, index) => (
								<TableRow
									key={index}
									sx={{
										bgcolor:
											alert.percentage_difference > 20
												? "rgba(255, 0, 0, 0.05)"
												: alert.percentage_difference >
												  10
												? "rgba(255, 153, 0, 0.05)"
												: "inherit",
									}}
								>
									<TableCell>{alert.product_name}</TableCell>
									<TableCell>
										${alert.product_price}
									</TableCell>
									<TableCell>
										{alert.competitor_name ||
											"Unnamed Competitor"}
										<div>
											<a
												href={alert.competitor_link}
												target="_blank"
												rel="noopener noreferrer"
												style={{ fontSize: "0.8rem" }}
											>
												View Product
											</a>
										</div>
									</TableCell>
									<TableCell>
										${alert.competitor_price}
									</TableCell>
									<TableCell>
										${alert.price_difference.toFixed(2)}
									</TableCell>
									<TableCell>
										<Chip
											label={`${alert.percentage_difference.toFixed(
												2
											)}%`}
											color={getSeverityColor(
												alert.percentage_difference
											)}
											size="small"
										/>
									</TableCell>
									<TableCell>
										{formatDate(alert.crawled_at)}
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>
			)}

			<Box sx={{ mt: 4 }}>
				<Typography variant="body2" color="text.secondary">
					* Alerts are shown when competitor prices are lower than
					your prices. Higher percentage differences indicate greater
					price disparities.
				</Typography>
			</Box>
		</Box>
	);
}

export default Reports;
