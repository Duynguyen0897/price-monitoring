import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Button,
    TextField,
    Card,
    CardContent,
    Grid,
    CircularProgress,
    Alert,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Stack,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Checkbox,
    FormControlLabel,
    FormGroup,
} from "@mui/material";
import {
    Search as SearchIcon,
    Delete as DeleteIcon,
    History as HistoryIcon,
    BugReport as TestIcon,
} from "@mui/icons-material";
import {
    searchProduct,
    getSearchResults,
    getSearchHistory,
    deleteSearchResult,
} from "../services/api";
import axios from "axios";

function Search() {
    const [searchQuery, setSearchQuery] = useState("kae-s695");
    const [platforms, setPlatforms] = useState({
        google: true,
        shopee: false,
        lazada: false,
    });
    const [maxResults, setMaxResults] = useState(3);
    const [searching, setSearching] = useState(false);
    const [testing, setTesting] = useState(false);
    const [results, setResults] = useState([]);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    useEffect(() => {
        fetchSearchHistory();
        fetchSearchResults();
    }, []);

    const fetchSearchHistory = async () => {
        try {
            const response = await getSearchHistory();
            setHistory(response.data);
        } catch (error) {
            console.error("Error fetching search history:", error);
        }
    };

    const fetchSearchResults = async () => {
        try {
            setLoading(true);
            const response = await getSearchResults();
            setResults(response.data);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching search results:", error);
            setLoading(false);
        }
    };

    const handleTest = async () => {
        if (!searchQuery.trim()) {
            setSnackbar({
                open: true,
                message: "Please enter a product name to test",
                severity: "error",
            });
            return;
        }

        try {
            setTesting(true);
            const response = await axios.get(`/api/search/test/${encodeURIComponent(searchQuery)}`);
            setSnackbar({
                open: true,
                message: `Test completed for "${searchQuery}". Check console logs and screenshots folder.`,
                severity: "success",
            });
        } catch (error) {
            console.error("Error during test:", error);
            setSnackbar({
                open: true,
                message: `Test error: ${error.response?.data?.error || error.message}`,
                severity: "error",
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            setSnackbar({
                open: true,
                message: "Please enter a product name to search",
                severity: "error",
            });
            return;
        }

        const selectedPlatforms = Object.keys(platforms).filter(
            (platform) => platforms[platform]
        );

        if (selectedPlatforms.length === 0) {
            setSnackbar({
                open: true,
                message: "Please select at least one platform",
                severity: "error",
            });
            return;
        }

        try {
            setSearching(true);
            await searchProduct({
                productName: searchQuery,
                platforms: selectedPlatforms,
                maxResults: maxResults,
            });

            setSnackbar({
                open: true,
                message: `Search started for "${searchQuery}". Results will appear shortly.`,
                severity: "info",
            });

            // Poll for results every 10 seconds
            const pollInterval = setInterval(async () => {
                try {
                    const response = await getSearchResults(searchQuery);
                    const newResults = response.data;
                    
                    if (newResults.length > 0) {
                        setResults(prev => {
                            const existingUrls = prev.map(r => r.url);
                            const uniqueNewResults = newResults.filter(r => !existingUrls.includes(r.url));
                            return [...uniqueNewResults, ...prev];
                        });
                        fetchSearchHistory();
                    }
                } catch (error) {
                    console.error("Error polling results:", error);
                }
            }, 10000);

            // Stop polling after 5 minutes
            setTimeout(() => {
                clearInterval(pollInterval);
                setSearching(false);
                setSnackbar({
                    open: true,
                    message: "Search process completed or timed out",
                    severity: "info",
                });
            }, 300000);

        } catch (error) {
            console.error("Error starting search:", error);
            setSearching(false);
            setSnackbar({
                open: true,
                message: `Error: ${error.response?.data?.message || "Failed to start search"}`,
                severity: "error",
            });
        }
    };

    const handlePlatformChange = (platform) => (event) => {
        setPlatforms({
            ...platforms,
            [platform]: event.target.checked,
        });
    };

    const handleDeleteResult = async (id) => {
        try {
            await deleteSearchResult(id);
            setResults(results.filter((r) => r.id !== id));
            setSnackbar({
                open: true,
                message: "Search result deleted successfully",
                severity: "success",
            });
        } catch (error) {
            console.error("Error deleting search result:", error);
            setSnackbar({
                open: true,
                message: "Failed to delete search result",
                severity: "error",
            });
        }
    };

    const handleHistoryClick = (query) => {
        setSearchQuery(query);
        // Don't auto-fetch, let user decide
    };

    const formatPrice = (price) => {
        if (!price) return "N/A";
        return parseFloat(price).toLocaleString("vi-VN", {
            maximumFractionDigits: 0,
        }) + "đ";
    };

    const getPlatformColor = (platform) => {
        switch (platform) {
            case "shopee": return "error";
            case "lazada": return "primary";
            case "tiki": return "secondary";
            default: return "default";
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>
                Product Search & Debug
            </Typography>

            {/* Search Form */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Grid container spacing={3} alignItems="center">
                        <Grid item xs={12} md={3}>
                            <TextField
                                fullWidth
                                label="Product Name or Model"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="e.g., kae-s695"
                                helperText="Try specific model numbers"
                            />
                        </Grid>

                        <Grid item xs={12} md={2}>
                            <FormControl fullWidth>
                                <InputLabel>Max Results</InputLabel>
                                <Select
                                    value={maxResults}
                                    label="Max Results"
                                    onChange={(e) => setMaxResults(e.target.value)}
                                >
                                    <MenuItem value={1}>1</MenuItem>
                                    <MenuItem value={3}>3</MenuItem>
                                    <MenuItem value={5}>5</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} md={3}>
                            <Typography variant="subtitle2" gutterBottom>
                                Platforms:
                            </Typography>
                            <FormGroup row>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={platforms.google}
                                            onChange={handlePlatformChange("google")}
                                        />
                                    }
                                    label="Google"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={platforms.shopee}
                                            onChange={handlePlatformChange("shopee")}
                                        />
                                    }
                                    label="Shopee"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={platforms.lazada}
                                            onChange={handlePlatformChange("lazada")}
                                        />
                                    }
                                    label="Lazada"
                                />
                            </FormGroup>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Stack direction="row" spacing={2}>
                                <Button
                                    variant="outlined"
                                    startIcon={
                                        testing ? <CircularProgress size={20} /> : <TestIcon />
                                    }
                                    onClick={handleTest}
                                    disabled={testing}
                                >
                                    {testing ? "Testing..." : "Test Google"}
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={
                                        searching ? <CircularProgress size={20} /> : <SearchIcon />
                                    }
                                    onClick={handleSearch}
                                    disabled={searching}
                                >
                                    {searching ? "Searching..." : "Search"}
                                </Button>
                            </Stack>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Debug Info */}
            {(searching || testing) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    {testing && "Running Google search test with visible browser..."}
                    {searching && "Search in progress... Check backend logs for details."}
                </Alert>
            )}

            {/* Search History */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        <HistoryIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                        Recent Searches
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {history.map((item, index) => (
                            <Chip
                                key={index}
                                label={`${item.search_query} (${item.result_count})`}
                                onClick={() => handleHistoryClick(item.search_query)}
                                variant="outlined"
                                sx={{ mb: 1 }}
                            />
                        ))}
                    </Stack>
                </CardContent>
            </Card>

            {/* Search Results */}
            <Typography variant="h5" gutterBottom>
                Search Results ({results.length})
            </Typography>

            {loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
                    <CircularProgress />
                </Box>
            ) : results.length === 0 ? (
                <Alert severity="info">
                    No search results found. Try the test button first to debug Google search issues.
                </Alert>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Product Name</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell>Platform</TableCell>
                                <TableCell>Search Query</TableCell>
                                <TableCell>Found At</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {results.map((result) => (
                                <TableRow key={result.id}>
                                    <TableCell>
                                        <a
                                            href={result.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ textDecoration: "none" }}
                                        >
                                            {result.product_name}
                                        </a>
                                    </TableCell>
                                    <TableCell>{formatPrice(result.price)}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={result.platform}
                                            size="small"
                                            color={getPlatformColor(result.platform)}
                                        />
                                    </TableCell>
                                    <TableCell>{result.search_query}</TableCell>
                                    <TableCell>
                                        {new Date(result.created_at).toLocaleString()}
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            color="error"
                                            onClick={() => handleDeleteResult(result.id)}
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

export default Search;