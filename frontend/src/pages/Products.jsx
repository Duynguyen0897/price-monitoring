import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, TextField, Dialog, DialogActions,
  DialogContent, DialogTitle, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, CircularProgress,
  Alert, Snackbar
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../services/api';

function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentProduct, setCurrentProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    link: ''
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      setProducts(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to load products. Please try again.');
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setFormData({ name: '', price: '', link: '' });
    setEditMode(false);
    setOpen(true);
  };

  const handleEditOpen = (product) => {
    setFormData({
      name: product.name,
      price: product.price,
      link: product.link
    });
    setCurrentProduct(product);
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
      if (!formData.name || !formData.price || !formData.link) {
        setSnackbar({
          open: true,
          message: 'Please fill in all fields',
          severity: 'error'
        });
        return;
      }

      // Convert price to number
      const productData = {
        ...formData,
        price: parseFloat(formData.price)
      };

      if (editMode && currentProduct) {
        await updateProduct(currentProduct.id, productData);
        setSnackbar({
          open: true,
          message: 'Product updated successfully',
          severity: 'success'
        });
      } else {
        await createProduct(productData);
        setSnackbar({
          open: true,
          message: 'Product added successfully',
          severity: 'success'
        });
      }

      setOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Error saving product:', err);
      setSnackbar({
        open: true,
        message: `Error: ${err.response?.data?.message || 'Failed to save product'}`,
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await deleteProduct(id);
      setSnackbar({
        open: true,
        message: 'Product deleted successfully',
        severity: 'success'
      });
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err);
      setSnackbar({
        open: true,
        message: `Error: ${err.response?.data?.message || 'Failed to delete product'}`,
        severity: 'error'
      });
    }
  };

  const formatPrice = (price) => {
    price = parseFloat(price).toLocaleString('vi-VN', { maximumFractionDigits: 0 })
    return price;
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Products</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpen}
        >
          Add Product
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Product List */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Link</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">No products found. Add a product to get started.</TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>{product.name}</TableCell>
                  <TableCell>{formatPrice(product.price)}đ</TableCell>
                  <TableCell>
                    <a href={product.link} target="_blank" rel="noopener noreferrer">
                      {product.link.length > 50 ? `${product.link.substring(0, 50)}...` : product.link}
                    </a>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton color="primary" onClick={() => handleEditOpen(product)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(product.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Product Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editMode ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="name"
            label="Product Name"
            type="text"
            fullWidth
            value={formData.name}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="price"
            label="Price"
            type="number"
            fullWidth
            value={formData.price}
            onChange={handleChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="link"
            label="Product Link"
            type="url"
            fullWidth
            value={formData.link}
            onChange={handleChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">Cancel</Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {editMode ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Products;