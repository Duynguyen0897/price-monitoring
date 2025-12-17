import React, { useState, useEffect } from "react";
import {
	Box,
	Typography,
	Card,
	CardContent,
	Button,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	CircularProgress,
	Alert,
	Snackbar,
	TextField,
	Paper,
	Divider,
	List,
	ListItem,
	ListItemText,
	ListItemIcon,
	Grid,
} from "@mui/material";
import {
	Schedule as ScheduleIcon,
	PlayArrow as TriggerIcon,
	Settings as SettingsIcon,
	Check as CheckIcon,
	History as HistoryIcon,
} from "@mui/icons-material";
import axios from "axios";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";

// Predefined schedules
const scheduleOptions = [
	{ value: "0 */2 * * *", label: "Every 2 hours (00:00, 02:00, 04:00, ...)" },
	{ value: "0 */4 * * *", label: "Every 4 hours (00:00, 04:00, 08:00, ...)" },
	{ value: "0 */6 * * *", label: "Every 6 hours (00:00, 06:00, 12:00, ...)" },
	{ value: "0 */12 * * *", label: "Every 12 hours (00:00, 12:00)" },
	{ value: "0 0 * * *", label: "Once a day at midnight" },
	{ value: "0 12 * * *", label: "Once a day at noon" },
	{ value: "custom", label: "Custom schedule..." },
];

function Scheduler() {
	const [status, setStatus] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [schedule, setSchedule] = useState("0 */2 * * *");
	const [customSchedule, setCustomSchedule] = useState("");
	const [showCustom, setShowCustom] = useState(false);
	const [triggering, setTriggering] = useState(false);
	const [updating, setUpdating] = useState(false);
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: "",
		severity: "success",
	});
	const [lastRun, setLastRun] = useState(null);

	useEffect(() => {
		fetchSchedulerStatus();
	}, []);

	const fetchSchedulerStatus = async () => {
		try {
			setLoading(true);
			const response = await axios.get(`${API_URL}/scheduler/status`);
			setStatus(response.data);
			setLoading(false);
		} catch (err) {
			console.error("Error fetching scheduler status:", err);
			setError("Failed to load scheduler status. Please try again.");
			setLoading(false);
		}
	};

	const handleScheduleChange = (event) => {
		const value = event.target.value;
		setSchedule(value);
		setShowCustom(value === "custom");
	};

	const handleCustomScheduleChange = (event) => {
		setCustomSchedule(event.target.value);
	};

	const handleUpdateSchedule = async () => {
		try {
			setUpdating(true);
			const cronPattern = showCustom ? customSchedule : schedule;

			if (!cronPattern) {
				setSnackbar({
					open: true,
					message: "Please enter a valid cron pattern",
					severity: "error",
				});
				setUpdating(false);
				return;
			}

			const response = await axios.post(
				`${API_URL}/scheduler/crawl/schedule`,
				{
					cronPattern,
				}
			);

			setSnackbar({
				open: true,
				message: "Crawl schedule updated successfully",
				severity: "success",
			});

			fetchSchedulerStatus();
			setUpdating(false);
		} catch (err) {
			console.error("Error updating schedule:", err);
			setSnackbar({
				open: true,
				message: `Error: ${
					err.response?.data?.message || "Failed to update schedule"
				}`,
				severity: "error",
			});
			setUpdating(false);
		}
	};

	const handleTriggerCrawl = async () => {
		try {
			setTriggering(true);

			await axios.post(`${API_URL}/scheduler/crawl/trigger`);

			setSnackbar({
				open: true,
				message: "Global crawl triggered successfully",
				severity: "success",
			});

			setLastRun(new Date());
			setTriggering(false);
		} catch (err) {
			console.error("Error triggering crawl:", err);
			setSnackbar({
				open: true,
				message: `Error: ${
					err.response?.data?.message || "Failed to trigger crawl"
				}`,
				severity: "error",
			});
			setTriggering(false);
		}
	};

	const handleCloseSnackbar = (event, reason) => {
		if (reason === "clickaway") {
			return;
		}
		setSnackbar({ ...snackbar, open: false });
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
				Scheduler Settings
			</Typography>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			<Grid container spacing={3}>
				<Grid item xs={12} md={6}>
					<Card>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								<ScheduleIcon
									sx={{ verticalAlign: "middle", mr: 1 }}
								/>
								Schedule Crawl
							</Typography>

							<Typography
								variant="body2"
								color="text.secondary"
								paragraph
							>
								Set how frequently you want to automatically
								crawl all competitor products.
							</Typography>

							<FormControl fullWidth sx={{ mb: 2 }}>
								<InputLabel id="schedule-select-label">
									Crawl Frequency
								</InputLabel>
								<Select
									labelId="schedule-select-label"
									value={schedule}
									label="Crawl Frequency"
									onChange={handleScheduleChange}
								>
									{scheduleOptions.map((option) => (
										<MenuItem
											key={option.value}
											value={option.value}
										>
											{option.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{showCustom && (
								<TextField
									fullWidth
									label="Custom Cron Pattern"
									placeholder="0 */2 * * *"
									value={customSchedule}
									onChange={handleCustomScheduleChange}
									helperText="Standard cron format: minute hour day month day-of-week"
									sx={{ mb: 2 }}
								/>
							)}

							<Button
								variant="contained"
								color="primary"
								onClick={handleUpdateSchedule}
								disabled={updating}
								startIcon={
									updating ? (
										<CircularProgress size={20} />
									) : (
										<SettingsIcon />
									)
								}
								fullWidth
							>
								Update Schedule
							</Button>
						</CardContent>
					</Card>
				</Grid>

				<Grid item xs={12} md={6}>
					<Card sx={{ mb: 3 }}>
						<CardContent>
							<Typography variant="h6" gutterBottom>
								<TriggerIcon
									sx={{ verticalAlign: "middle", mr: 1 }}
								/>
								Manual Trigger
							</Typography>

							<Typography
								variant="body2"
								color="text.secondary"
								paragraph
							>
								Manually trigger a crawl of all competitor
								products right now.
							</Typography>

							<Button
								variant="contained"
								color="secondary"
								onClick={handleTriggerCrawl}
								disabled={triggering}
								startIcon={
									triggering ? (
										<CircularProgress size={20} />
									) : (
										<>PlayArrow</>
									)
								}
								fullWidth
							>
								Start Crawl Now
							</Button>

							{lastRun && (
								<Typography variant="body2" sx={{ mt: 2 }}>
									<HistoryIcon
										sx={{
											verticalAlign: "middle",
											fontSize: "small",
											mr: 1,
										}}
									/>
									Last manual trigger:{" "}
									{lastRun.toLocaleString()}
								</Typography>
							)}
						</CardContent>
					</Card>

					<Paper>
						<Box sx={{ p: 2 }}>
							<Typography variant="h6" gutterBottom>
								Scheduler Status
							</Typography>

							<List dense>
								<ListItem>
									<ListItemIcon>
										<CheckIcon
											color={
												status?.isInitialized
													? "success"
													: "error"
											}
										/>
									</ListItemIcon>
									<ListItemText
										primary="Scheduler Status"
										secondary={
											status?.isInitialized
												? "Active"
												: "Inactive"
										}
									/>
								</ListItem>

								{status?.jobs.map((job, index) => (
									<ListItem key={index}>
										<ListItemIcon>
											<CheckIcon
												color={
													job.isRunning
														? "success"
														: "error"
												}
											/>
										</ListItemIcon>
										<ListItemText
											primary={`${job.name} Job`}
											secondary={
												job.isRunning
													? "Running"
													: "Stopped"
											}
										/>
									</ListItem>
								))}
							</List>
						</Box>
					</Paper>
				</Grid>
			</Grid>

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

export default Scheduler;
