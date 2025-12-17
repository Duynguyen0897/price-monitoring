import React, { useState, useEffect } from "react";
import {
	Typography,
	Grid,
	Card,
	CardContent,
	Box,
	CircularProgress,
	Alert,
} from "@mui/material";
import { getAllPriceAlerts, getProducts, getCrawls } from "../services/api";

function Dashboard() {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [summary, setSummary] = useState({
		products: 0,
		competitors: 0,
		alerts: 0,
	});
	const [alerts, setAlerts] = useState([]);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);

				const [productsResponse, crawlsResponse, alertsResponse] =
					await Promise.all([
						getProducts(),
						getCrawls(),
						getAllPriceAlerts(),
					]);

				setSummary({
					products: productsResponse.data.length,
					competitors: crawlsResponse.data.length,
					alerts: alertsResponse.data.length,
				});

				setAlerts(alertsResponse.data.slice(0, 5)); // Show only top 5 alerts
				setLoading(false);
			} catch (err) {
				console.error("Error fetching dashboard data:", err);
				setError(
					"Failed to load dashboard data. Please try again later."
				);
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, []);

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return <Alert severity="error">{error}</Alert>;
	}

	return (
		<Box>
			<Typography variant="h4" gutterBottom>
				Dashboard
			</Typography>

			<Grid container spacing={3} sx={{ mb: 4 }}>
				<Grid item xs={12} sm={4}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								Products
							</Typography>
							<Typography variant="h3">
								{summary.products}
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} sm={4}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								Competitor Products
							</Typography>
							<Typography variant="h3">
								{summary.competitors}
							</Typography>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} sm={4}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom>
								Price Alerts
							</Typography>
							<Typography variant="h3">
								{summary.alerts}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			<Typography variant="h5" gutterBottom>
				Top Price Alerts
			</Typography>

			{alerts.length === 0 ? (
				<Alert severity="info">No price alerts to display</Alert>
			) : (
				<Grid container spacing={2}>
					{alerts.map((alert, index) => (
						<Grid item xs={12} key={index}>
							<Card
								sx={{
									bgcolor:
										alert.percentage_difference > 20
											? "#ffebee"
											: "#fff",
								}}
							>
								<CardContent>
									<Grid container spacing={2}>
										<Grid item xs={12} sm={6}>
											<Typography variant="subtitle1">
												{alert.product_name}
											</Typography>
											<Typography
												variant="body2"
												color="textSecondary"
											>
												Your price: $
												{alert.product_price}
											</Typography>
										</Grid>
										<Grid item xs={12} sm={6}>
											<Typography variant="subtitle1">
												{alert.competitor_name}
											</Typography>
											<Typography
												variant="body2"
												color="error"
											>
												Competitor price: $
												{alert.competitor_price}(
												{alert.percentage_difference}%
												lower)
											</Typography>
										</Grid>
									</Grid>
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>
			)}
		</Box>
	);
}

export default Dashboard;
