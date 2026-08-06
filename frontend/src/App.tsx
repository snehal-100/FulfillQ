import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ThemeProvider, createTheme, CssBaseline, AppBar, Toolbar, Typography, Button, Badge, Box, Snackbar, Alert, Container, IconButton } from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DashboardIcon from '@mui/icons-material/Dashboard';
import StorefrontIcon from '@mui/icons-material/Storefront';
import HistoryIcon from '@mui/icons-material/History';
import BusinessIcon from '@mui/icons-material/Business';
import LockOpenIcon from '@mui/icons-material/LockOpen';

import { type RootState } from './store';
import { logout } from './store/authSlice';

// Pages
import ProductCatalog from './pages/ProductCatalog';
import ProductDetails from './pages/ProductDetails';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderHistory from './pages/OrderHistory';
import TrackingPage from './pages/TrackingPage';
import AdminDashboard from './pages/AdminDashboard';
import ManagerPortal from './pages/ManagerPortal';
import Login from './pages/Login';
import Register from './pages/Register';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#10b981', // Emerald
    },
    secondary: {
      main: '#06b6d4', // Cyan
    },
    background: {
      default: '#04080f',
      paper: '#08101c',
    },
    text: {
      primary: '#f0fdf4',
      secondary: '#94a3b8',
    },
  },
  typography: {
    fontFamily: '"Space Grotesk", "Outfit", "Inter", "Helvetica", sans-serif',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

const App: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Toast notification state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'info' | 'success' | 'warning' | 'error'>('info');

  const showNotification = (message: string, severity: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    setToastMsg(message);
    setToastSeverity(severity);
    setToastOpen(true);
  };

  useEffect(() => {
    // Seed localStorage mock databases for offline synchronization
    const seedLocalStorage = () => {
      if (!localStorage.getItem('fulfilliq_orders')) {
        localStorage.setItem('fulfilliq_orders', JSON.stringify([
          { id: 101, customerId: 3, status: 'DELIVERED', paymentStatus: 'COMPLETED', shippingCost: 250, totalAmount: 35499, createdAt: '2026-08-01T14:32:00' },
          { id: 102, customerId: 3, status: 'RESERVED', paymentStatus: 'PENDING', shippingCost: 450, totalAmount: 110449, createdAt: '2026-08-05T10:15:00' },
        ]));
      }
      if (!localStorage.getItem('fulfilliq_shipments')) {
        localStorage.setItem('fulfilliq_shipments', JSON.stringify([
          { id: 201, orderId: 101, warehouseId: 1, trackingNumber: 'FIQ-8AD47F9', courier: 'FedEx', status: 'DELIVERED', updatedAt: '2026-08-05T12:00:00' },
          { id: 202, orderId: 102, warehouseId: 2, trackingNumber: 'FIQ-7AD99C2', courier: 'UPS', status: 'PACKED', updatedAt: '2026-08-06T09:00:00' },
        ]));
      }
      if (!localStorage.getItem('fulfilliq_inventory')) {
        localStorage.setItem('fulfilliq_inventory', JSON.stringify([
          { id: 1, warehouseId: 1, productId: 1, availableStock: 800, reservedStock: 2 },
          { id: 2, warehouseId: 2, productId: 1, availableStock: 5, reservedStock: 0 },
          { id: 3, warehouseId: 3, productId: 1, availableStock: 0, reservedStock: 1 },
          { id: 4, warehouseId: 4, productId: 1, availableStock: 8, reservedStock: 0 },
          { id: 5, warehouseId: 5, productId: 1, availableStock: 3, reservedStock: 0 },
          { id: 6, warehouseId: 1, productId: 2, availableStock: 80, reservedStock: 10 },
          { id: 7, warehouseId: 2, productId: 2, availableStock: 35, reservedStock: 5 },
          { id: 8, warehouseId: 4, productId: 3, availableStock: 45, reservedStock: 0 },
          { id: 9, warehouseId: 5, productId: 3, availableStock: 50, reservedStock: 0 },
          { id: 10, warehouseId: 6, productId: 5, availableStock: 20, reservedStock: 0 },
          { id: 11, warehouseId: 7, productId: 6, availableStock: 30, reservedStock: 0 },
          { id: 12, warehouseId: 1, productId: 7, availableStock: 12, reservedStock: 0 }
        ]));
      }
      if (!localStorage.getItem('fulfilliq_transfers')) {
        localStorage.setItem('fulfilliq_transfers', JSON.stringify([
          {
            id: 501,
            fromWarehouseId: 1,
            toWarehouseId: 2,
            status: 'RECEIVED',
            items: [{ productId: 1, quantity: 20 }],
            createdAt: '2026-08-05T09:00:00',
            updatedAt: '2026-08-05T14:30:00'
          },
          {
            id: 502,
            fromWarehouseId: 1,
            toWarehouseId: 2,
            status: 'PENDING',
            items: [{ productId: 1, quantity: 50 }],
            createdAt: '2026-08-06T10:00:00',
            updatedAt: '2026-08-06T10:00:00'
          }
        ]));
      }
    };
    seedLocalStorage();

    // Connect WebSocket for real-time notification dispatches
    let ws: WebSocket;
    const connectWS = () => {
      ws = new WebSocket('ws://localhost:8086/ws-notifications');

      ws.onopen = () => {
        console.log('[WEBSOCKET] Connected to FulfillIQ real-time notification engine.');
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[WEBSOCKET EVENT] Received: ', data);
          
          if (data.orderId && data.splits) {
            showNotification(`[ORDER CREATED] Order #${data.orderId} placed! Sourced across ${data.splits.length} warehouse(s).`, 'success');
          } else if (data.orderId && data.quantity) {
            showNotification(`[STOCK RESERVED] Sourced ${data.quantity} units from warehouse ${data.warehouseId} for Order #${data.orderId}.`, 'info');
          } else if (data.trackingNumber && data.courier) {
            showNotification(`[SHIPMENT GENERATED] Dispatch tracking ${data.trackingNumber} packed via ${data.courier}.`, 'success');
          } else if (data.status === 'DELIVERED') {
            showNotification(`[DELIVERY UPDATE] Shipment #${data.shipmentId} (Order #${data.orderId}) delivered.`, 'success');
          } else if (data.message) {
            showNotification(`[ALERT] ${data.message}`, 'warning');
          } else {
            showNotification(`System update received: ${JSON.stringify(data)}`, 'info');
          }
        } catch (e) {
          // Plain text messages
          showNotification(event.data, 'info');
        }
      };

      ws.onerror = (err) => {
        console.warn('[WEBSOCKET] Error connecting to notification gateway. Check server status.');
      };

      ws.onclose = () => {
        console.log('[WEBSOCKET] Connection closed. Retrying in 10s...');
        setTimeout(connectWS, 10000);
      };
    };

    connectWS();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        
        {!isAuthPage && (
          <AppBar position="sticky" sx={{ background: 'rgba(11, 15, 25, 0.8)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }} elevation={0}>
            <Container maxWidth="lg">
              <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h5" fontWeight="800" component={Link} to="/" style={{ textDecoration: 'none', color: '#f3f4f6', fontFamily: 'Outfit', letterSpacing: '-0.5px' }}>
                  Fulfill<span style={{ color: '#10b981' }}>IQ</span>
                </Typography>

                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  {user ? (
                    <>
                      {user.role === 'CUSTOMER' && (
                        <>
                          <Button startIcon={<StorefrontIcon />} component={Link} to="/" color="inherit">Catalog</Button>
                          <Button startIcon={<HistoryIcon />} component={Link} to="/orders" color="inherit">My Orders</Button>
                          <IconButton component={Link} to="/cart" color="inherit">
                            <Badge badgeContent={cartItems.reduce((acc, item) => acc + item.quantity, 0)} color="secondary">
                              <ShoppingCartIcon />
                            </Badge>
                          </IconButton>
                        </>
                      )}

                      {user.role === 'ADMIN' && (
                        <>
                          <Button startIcon={<DashboardIcon />} component={Link} to="/admin" color="primary" variant="outlined">Admin Panel</Button>
                          <Button startIcon={<StorefrontIcon />} component={Link} to="/" color="inherit">Store Catalog</Button>
                        </>
                      )}

                      {user.role === 'WAREHOUSE_MANAGER' && (
                        <Button startIcon={<BusinessIcon />} component={Link} to="/manager" color="secondary" variant="outlined">Manager Dashboard</Button>
                      )}

                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', ml: 2 }}>
                        <Typography variant="caption" sx={{ color: '#9ca3af', display: { xs: 'none', sm: 'block' } }}>
                          ({user.role}) <strong>{user.name}</strong>
                        </Typography>
                        <Button onClick={handleLogout} color="error" size="small" variant="text">Log Out</Button>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Button startIcon={<LockOpenIcon />} component={Link} to="/login" variant="contained" sx={{ background: 'linear-gradient(45deg, #10b981, #06b6d4)' }}>Log In</Button>
                      <Button component={Link} to="/register" color="inherit">Register</Button>
                    </>
                  )}
                </Box>
              </Toolbar>
            </Container>
          </AppBar>
        )}

        <Box sx={{ flexGrow: 1 }}>
          <Routes>
            <Route path="/" element={<ProductCatalog />} />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout" element={<CheckoutPage />} />
            <Route path="/orders" element={<OrderHistory />} />
            <Route path="/tracking/:orderId" element={<TrackingPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/manager" element={<ManagerPortal />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </Box>

        <Snackbar open={toastOpen} autoHideDuration={5000} onClose={() => setToastOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
          <Alert severity={toastSeverity} onClose={() => setToastOpen(false)} sx={{ width: '100%' }}>
            {toastMsg}
          </Alert>
        </Snackbar>

      </Box>
    </ThemeProvider>
  );
};

export default App;
