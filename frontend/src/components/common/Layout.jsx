import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
	AppBar,
	Box,
	CssBaseline,
	Divider,
	Drawer,
	IconButton,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Toolbar,
	Typography,
	Button,
} from "@mui/material";
import {
	Dashboard as DashboardIcon,
	ShoppingCart as ProductsIcon,
	CompareArrows as CompetitorsIcon,
	Assessment as ReportsIcon,
	Schedule as SchedulerIcon,
	Search as SearchIcon,
	Menu as MenuIcon,
} from "@mui/icons-material";

const drawerWidth = 240;

function Layout({ children }) {
	const [mobileOpen, setMobileOpen] = useState(false);
	const location = useLocation();

	const handleDrawerToggle = () => {
		setMobileOpen(!mobileOpen);
	};

	const menuItems = [
		{ text: "Dashboard", icon: <DashboardIcon />, path: "/" },
		{ text: "Products", icon: <ProductsIcon />, path: "/products" },
		{
			text: "Competitors",
			icon: <CompetitorsIcon />,
			path: "/competitors",
		},
		{ text: "Search Products", icon: <SearchIcon />, path: "/search" },
		{ text: "Reports", icon: <ReportsIcon />, path: "/reports" },
		{ text: "Scheduler", icon: <SchedulerIcon />, path: "/scheduler" },
	];

	const drawer = (
		<div>
			<Toolbar>
				<Typography variant="h6" noWrap component="div">
					Price Monitor
				</Typography>
			</Toolbar>
			<Divider />
			<List>
				{menuItems.map((item) => (
					<ListItem key={item.text} disablePadding>
						<ListItemButton
							component={Link}
							to={item.path}
							selected={location.pathname === item.path}
						>
							<ListItemIcon>{item.icon}</ListItemIcon>
							<ListItemText primary={item.text} />
						</ListItemButton>
					</ListItem>
				))}
			</List>
		</div>
	);

	return (
		<Box sx={{ display: "flex" }}>
			<CssBaseline />
			<AppBar
				position="fixed"
				sx={{
					width: { sm: `calc(100% - ${drawerWidth}px)` },
					ml: { sm: `${drawerWidth}px` },
				}}
			>
				<Toolbar>
					<IconButton
						color="inherit"
						aria-label="open drawer"
						edge="start"
						onClick={handleDrawerToggle}
						sx={{ mr: 2, display: { sm: "none" } }}
					>
						<MenuIcon />
					</IconButton>
					<Typography
						variant="h6"
						noWrap
						component="div"
						sx={{ flexGrow: 1 }}
					>
						Price Monitoring App
					</Typography>
				</Toolbar>
			</AppBar>
			<Box
				component="nav"
				sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
				aria-label="mailbox folders"
			>
				<Drawer
					variant="temporary"
					open={mobileOpen}
					onClose={handleDrawerToggle}
					ModalProps={{
						keepMounted: true, // Better open performance on mobile.
					}}
					sx={{
						display: { xs: "block", sm: "none" },
						"& .MuiDrawer-paper": {
							boxSizing: "border-box",
							width: drawerWidth,
						},
					}}
				>
					{drawer}
				</Drawer>
				<Drawer
					variant="permanent"
					sx={{
						display: { xs: "none", sm: "block" },
						"& .MuiDrawer-paper": {
							boxSizing: "border-box",
							width: drawerWidth,
						},
					}}
					open
				>
					{drawer}
				</Drawer>
			</Box>
			<Box
				component="main"
				sx={{
					flexGrow: 1,
					p: 3,
					width: { sm: `calc(100% - ${drawerWidth}px)` },
				}}
			>
				<Toolbar />
				{children}
			</Box>
		</Box>
	);
}

export default Layout;
