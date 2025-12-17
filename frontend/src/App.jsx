import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Competitors from "./pages/Competitors";
import Search from "./pages/Search";
import Reports from "./pages/Reports";
import Scheduler from "./pages/Scheduler";
import Layout from "./components/common/Layout";

const theme = createTheme({
    palette: {
        primary: {
            main: "#1976d2",
        },
        secondary: {
            main: "#dc004e",
        },
    },
});

function App() {
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Router>
                <Layout>
                    <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/competitors" element={<Competitors />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/scheduler" element={<Scheduler />} />
                    </Routes>
                </Layout>
            </Router>
        </ThemeProvider>
    );
}

export default App;