import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { Container, Typography, Box, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, IconButton, TextField } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { type RootState } from '../store';
import { updateQuantity, removeFromCart } from '../store/cartSlice';

const CartPage: React.FC = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();

  const handleQtyChange = (id: number, val: number) => {
    if (val < 1) return;
    dispatch(updateQuantity({ id, quantity: val }));
  };

  const handleRemove = (id: number) => {
    dispatch(removeFromCart(id));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  if (cartItems.length === 0) {
    return (
      <Container sx={{ py: 10, textAlign: 'center' }}>
        <Typography variant="h5" color="text.secondary" gutterBottom>
          Your cart is currently empty.
        </Typography>
        <Button component={Link} to="/" variant="contained" sx={{ mt: 3, background: 'linear-gradient(45deg, #6366f1, #a855f7)' }}>
          Browse Catalog
        </Button>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Outfit' }}>
        Shopping Cart
      </Typography>

      <TableContainer component={Paper} className="glass-panel" sx={{ background: 'rgba(17, 24, 39, 0.5)', mt: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Product Details</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Price</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cartItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {item.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    SKU: {item.sku}
                  </Typography>
                </TableCell>
                <TableCell align="right">₹{item.price.toLocaleString('en-IN')}</TableCell>
                <TableCell align="center">
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1 }}>
                    <Button size="small" onClick={() => handleQtyChange(item.id, item.quantity - 1)}>
                      -
                    </Button>
                    <TextField
                      value={item.quantity}
                      size="small"
                      variant="outlined"
                      sx={{ width: 60 }}
                      inputProps={{ style: { textAlign: 'center' } }}
                    />
                    <Button size="small" onClick={() => handleQtyChange(item.id, item.quantity + 1)}>
                      +
                    </Button>
                  </Box>
                </TableCell>
                <TableCell align="right" style={{ color: '#a855f7', fontWeight: 'bold' }}>
                  ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                </TableCell>
                <TableCell align="center">
                  <IconButton color="error" onClick={() => handleRemove(item.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
        <Box sx={{ display: 'flex', gap: 4 }}>
          <Typography variant="h6" color="text.secondary">
            Subtotal:
          </Typography>
          <Typography variant="h5" fontWeight="bold" color="primary.main">
            ₹{subtotal.toLocaleString('en-IN')}
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/checkout"
          variant="contained"
          size="large"
          sx={{
            background: 'linear-gradient(45deg, #6366f1, #a855f7)',
            px: 4,
            py: 1.5,
            fontWeight: 'bold',
          }}
        >
          Proceed to Checkout
        </Button>
      </Box>
    </Container>
  );
};

export default CartPage;
