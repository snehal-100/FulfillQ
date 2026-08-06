import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, Grid, Typography, Box, Button, Card, CardContent, Paper, Alert, Snackbar } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { type RootState } from '../store';
import { clearCart } from '../store/cartSlice';
import axios from 'axios';
import L from 'leaflet';

// Fix Leaflet Default Icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom marker for warehouses
const warehouseIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2890/2890527.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

interface Warehouse {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
}

const CheckoutPage: React.FC = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const user = useSelector((state: RootState) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [coords, setCoords] = useState<[number, number]>([28.6139, 77.2090]); // Delhi defaults
  const [warehouses, setWarehouses] = useState<any[]>([
    { id: 1, name: 'Delhi Hub', latitude: 28.6304, longitude: 77.2177, address: 'Connaught Place, New Delhi' },
    { id: 2, name: 'Mumbai Terminal', latitude: 19.0760, longitude: 72.8777, address: 'Andheri East, Mumbai' },
    { id: 3, name: 'Bangalore Terminal', latitude: 12.9716, longitude: 77.5946, address: 'Koramangala, Bangalore' },
    { id: 4, name: 'Hyderabad Hub', latitude: 17.3850, longitude: 78.4867, address: 'Gachibowli, Hyderabad' },
    { id: 5, name: 'Kolkata Terminal', latitude: 22.5726, longitude: 88.3639, address: 'Salt Lake Sector V, Kolkata' },
    { id: 6, name: 'Chennai Hub', latitude: 13.0827, longitude: 80.2707, address: 'Guindy Industrial Estate, Chennai' },
    { id: 7, name: 'Pune Terminal', latitude: 18.5204, longitude: 73.8567, address: 'Hinjewadi Tech Park, Pune' },
  ]);

  const [isPlacing, setIsPlacing] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  useEffect(() => {
    // Try to load real warehouses to show on the map
    const loadWarehouses = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/warehouses');
        if (res.data && res.data.length > 0) {
          setWarehouses(res.data);
        }
      } catch (err) {
        console.warn("Could not load real warehouses for checkout map. Using mock warehouses.");
      }
    };
    loadWarehouses();
  }, []);

  // Map Click Handler component
  const MapClickHandler = () => {
    useMapEvents({
      click(e) {
        setCoords([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  };

  const handlePlaceOrder = async () => {
    setIsPlacing(true);
    const orderPayload = {
      customerId: user?.id || 999, // default customer ID
      latitude: coords[0],
      longitude: coords[1],
      items: cartItems.map(item => ({
        productId: item.id,
        quantity: item.quantity
      }))
    };

    try {
      let orderRes;
      try {
        orderRes = await axios.post('http://localhost:8080/api/orders', orderPayload, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        });
        setToastMsg(`Order split & reserved successfully! Order ID: ${orderRes.data.id}`);
        setToastOpen(true);
        dispatch(clearCart());
        setTimeout(() => navigate(`/tracking/${orderRes.data.id}`), 2000);
      } catch (err) {
        console.warn("Backend Order API offline. Simulating intelligent split routing and storing in localStorage.");
        const mockOrderId = Math.floor(Math.random() * 900) + 103;

        // 1. Save the order in localStorage
        const storedOrders = localStorage.getItem('fulfilliq_orders');
        const orders = storedOrders ? JSON.parse(storedOrders) : [];
        const newOrder = {
          id: mockOrderId,
          customerId: user?.id || 3,
          status: 'RESERVED',
          paymentStatus: 'PENDING',
          shippingCost: Math.floor(Math.random() * 300) + 150,
          totalAmount: subtotal,
          createdAt: new Date().toISOString()
        };
        orders.unshift(newOrder);
        localStorage.setItem('fulfilliq_orders', JSON.stringify(orders));

        // 2. Create and Save split dispatches in localStorage
        const storedShipments = localStorage.getItem('fulfilliq_shipments');
        const shipments = storedShipments ? JSON.parse(storedShipments) : [];
        
        const trackingNum1 = 'FIQ-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        const trackingNum2 = 'FIQ-' + Math.random().toString(36).substring(2, 9).toUpperCase();
        
        const newShipment1 = {
          id: Math.floor(Math.random() * 10000) + 300,
          orderId: mockOrderId,
          warehouseId: 1, // Delhi Hub
          trackingNumber: trackingNum1,
          courier: 'FedEx',
          status: 'PACKED',
          updatedAt: new Date().toISOString()
        };
        
        const newShipment2 = {
          id: Math.floor(Math.random() * 10000) + 300,
          orderId: mockOrderId,
          warehouseId: 2, // Mumbai Terminal
          trackingNumber: trackingNum2,
          courier: 'Delhivery',
          status: 'PACKED',
          updatedAt: new Date().toISOString()
        };

        shipments.push(newShipment1);
        shipments.push(newShipment2);
        localStorage.setItem('fulfilliq_shipments', JSON.stringify(shipments));

        setToastMsg(`[MOCK SUCCESS] Order placed & split across warehouses! Sourced from Delhi & Mumbai. Order ID: ${mockOrderId}`);
        setToastOpen(true);
        dispatch(clearCart());
        setTimeout(() => navigate(`/tracking/${mockOrderId}`), 2000);
      }
    } catch (error: any) {
      setToastMsg("Order failed: " + (error.response?.data?.message || error.message));
      setToastOpen(true);
    } finally {
      setIsPlacing(false);
    }
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

  return (
    <Container sx={{ py: 6 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Outfit' }}>
        Checkout & Split Routing
      </Typography>

      <Grid container spacing={4} sx={{ mt: 1 }}>
        <Grid item xs={12} md={7}>
          <Card className="glass-panel" sx={{ background: 'rgba(17, 24, 39, 0.5)', overflow: 'hidden' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Select Delivery Location on Map
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click anywhere on the map to place your delivery pin. The platform will automatically calculate distances and route inventory from the nearest warehouses.
              </Typography>

              <Box sx={{ height: 350, position: 'relative' }}>
                <MapContainer center={coords} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <Marker position={coords}>
                    <Popup>Your Delivery Address <br /> Lat: {coords[0].toFixed(4)}, Lon: {coords[1].toFixed(4)}</Popup>
                  </Marker>

                  {warehouses.map((wh) => (
                    <Marker key={wh.id} position={[wh.latitude, wh.longitude]} icon={warehouseIcon}>
                      <Popup>
                        <strong>{wh.name}</strong> <br />
                        {wh.address}
                      </Popup>
                    </Marker>
                  ))}
                  <MapClickHandler />
                </MapContainer>
              </Box>

              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Paper variant="outlined" sx={{ p: 1, flexGrow: 1, textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
                  <Typography variant="caption" color="text.secondary">Latitude</Typography>
                  <Typography variant="body2" fontWeight="bold">{coords[0].toFixed(5)}</Typography>
                </Paper>
                <Paper variant="outlined" sx={{ p: 1, flexGrow: 1, textAlign: 'center', background: 'rgba(0,0,0,0.2)' }}>
                  <Typography variant="caption" color="text.secondary">Longitude</Typography>
                  <Typography variant="body2" fontWeight="bold">{coords[1].toFixed(5)}</Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Card className="glass-panel" sx={{ background: 'rgba(17, 24, 39, 0.5)' }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="h6" fontWeight="bold">
                Order Summary
              </Typography>
              
              <Box sx={{ maxHeight: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                {cartItems.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', pb: 1 }}>
                    <Typography variant="body2">{item.name} x {item.quantity}</Typography>
                    <Typography variant="body2" fontWeight="bold">₹{(item.price * item.quantity).toLocaleString('en-IN')}</Typography>
                  </Box>
                ))}
              </Box>

              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Items Subtotal:</Typography>
                  <Typography variant="body2">₹{subtotal.toLocaleString('en-IN')}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Est. Shipping Cost:</Typography>
                  <Typography variant="body2" color="success.main">Calculated on placement</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2, borderTop: '1px solid var(--panel-border)' }}>
                  <Typography variant="subtitle1" fontWeight="bold">Total Amount:</Typography>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary.main">₹{subtotal.toLocaleString('en-IN')}</Typography>
                </Box>
              </Box>

              <Alert severity="info" sx={{ background: 'rgba(2, 136, 209, 0.1)', color: '#b3e5fc', border: '1px solid rgba(2, 136, 209, 0.2)' }}>
                FulfillIQ will split items to satisfy constraints if a single warehouse has insufficient inventory.
              </Alert>

              <Button
                variant="contained"
                size="large"
                fullWidth
                onClick={handlePlaceOrder}
                disabled={isPlacing}
                sx={{
                  background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                  fontWeight: 'bold',
                  py: 1.5,
                  mt: 1
                }}
              >
                {isPlacing ? 'Routing & Reserving...' : 'Place Order'}
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={toastOpen} autoHideDuration={6000} onClose={() => setToastOpen(false)}>
        <Alert severity="success" sx={{ width: '100%' }}>{toastMsg}</Alert>
      </Snackbar>
    </Container>
  );
};

export default CheckoutPage;
