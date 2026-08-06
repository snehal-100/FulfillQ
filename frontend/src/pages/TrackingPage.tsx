import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Grid, Typography, Box, Card, CardContent, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button } from '@mui/material';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';

// Fix Leaflet Icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom Icons
const warehouseIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/2890/2890527.png',
  iconSize: [35, 35],
  iconAnchor: [17, 35],
});

interface Shipment {
  id: number;
  orderId: number;
  warehouseId: number;
  trackingNumber: string;
  courier: string;
  status: string;
  updatedAt: string;
}

const TrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [customerCoords, setCustomerCoords] = useState<[number, number]>([28.6139, 77.2090]); // Delhi
  const [warehouses, setWarehouses] = useState<Record<number, any>>({
    1: { id: 1, name: 'Delhi Hub', latitude: 28.6304, longitude: 77.2177, address: 'Connaught Place, New Delhi' },
    2: { id: 2, name: 'Mumbai Terminal', latitude: 19.0760, longitude: 72.8777, address: 'Andheri East, Mumbai' },
    3: { id: 3, name: 'Bangalore Terminal', latitude: 12.9716, longitude: 77.5946, address: 'Koramangala, Bangalore' },
    4: { id: 4, name: 'Hyderabad Hub', latitude: 17.3850, longitude: 78.4867, address: 'Gachibowli, Hyderabad' },
    5: { id: 5, name: 'Kolkata Terminal', latitude: 22.5726, longitude: 88.3639, address: 'Salt Lake Sector V, Kolkata' },
    6: { id: 6, name: 'Chennai Hub', latitude: 13.0827, longitude: 80.2707, address: 'Guindy Industrial Estate, Chennai' },
    7: { id: 7, name: 'Pune Terminal', latitude: 18.5204, longitude: 73.8567, address: 'Hinjewadi Tech Park, Pune' },
  });

  useEffect(() => {
    const fetchTracking = async () => {
      // 1. Fetch shipments for this order
      try {
        const res = await axios.get(`http://localhost:8080/api/shipping/order/${orderId}`);
        setShipments(res.data);
      } catch (err) {
        // Mock fallback shipments
        console.warn("Could not fetch real shipment tracking. Simulating split shipment logs.");
        setShipments([
          { id: 201, orderId: Number(orderId), warehouseId: 1, trackingNumber: 'FIQ-8AD47F9', courier: 'FedEx', status: 'SHIPPED', updatedAt: '2026-08-05T12:00:00' },
          { id: 202, orderId: Number(orderId), warehouseId: 2, trackingNumber: 'FIQ-6BD12D6', courier: 'DHL Express', status: 'PACKED', updatedAt: '2026-08-05T11:30:00' },
        ]);
      }

      // 2. Fetch order coords
      try {
        const orderRes = await axios.get(`http://localhost:8080/api/orders/${orderId}`);
        // If order exists in database, let's assume we also have the location details or query mock
      } catch (err) {
        // Keep default Delhi coordinates
      }

      // 3. Fetch warehouses
      try {
        const whRes = await axios.get('http://localhost:8080/api/warehouses');
        const mapping: Record<number, any> = {};
        whRes.data.forEach((w: any) => {
          mapping[w.id] = w;
        });
        setWarehouses(mapping);
      } catch (err) {
        // Keep mock warehouses mapping
      }
    };

    fetchTracking();
  }, [orderId]);

  return (
    <Container sx={{ py: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" sx={{ fontFamily: 'Outfit' }}>
          Tracking Order #{orderId}
        </Typography>
        <Button component={Link} to="/orders" variant="outlined">
          Back to Orders
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Card className="glass-panel" sx={{ background: 'rgba(17, 24, 39, 0.5)', overflow: 'hidden' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                Intelligent Split Route Map
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                See how FulfillIQ split your order items across the logistics network. Hover over pins to see coordinates and fulfillment sources.
              </Typography>

              <Box sx={{ height: 400 }}>
                <MapContainer center={customerCoords} zoom={5} scrollWheelZoom={true} style={{ height: '100%', width: '100%', borderRadius: '12px' }}>
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  {/* Customer Marker */}
                  <Marker position={customerCoords}>
                    <Popup>Your Delivery Address</Popup>
                  </Marker>

                  {/* Draw markers and routes for warehouses involved */}
                  {shipments.map((shipment) => {
                    const wh = warehouses[shipment.warehouseId];
                    if (!wh) return null;

                    const warehouseCoords: [number, number] = [wh.latitude, wh.longitude];

                    return (
                      <React.Fragment key={shipment.id}>
                        {/* Warehouse Marker */}
                        <Marker position={warehouseCoords} icon={warehouseIcon}>
                          <Popup>
                            <strong>{wh.name}</strong> <br />
                            Sourcing Shipment: {shipment.trackingNumber}
                          </Popup>
                        </Marker>

                        {/* Polyline Route */}
                        <Polyline
                          positions={[warehouseCoords, customerCoords]}
                          color={shipment.warehouseId === 1 ? '#6366f1' : '#a855f7'}
                          dashArray="5, 10"
                          weight={3}
                        />
                      </React.Fragment>
                    );
                  })}
                </MapContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={5}>
          <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Outfit' }}>
            Shipment Dispatches
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
            {shipments.map((shipment) => {
              const wh = warehouses[shipment.warehouseId];
              return (
                <Card key={shipment.id} className="glass-panel" sx={{ background: 'rgba(17, 24, 39, 0.4)' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#818cf8' }}>
                        {wh?.name || `Warehouse ${shipment.warehouseId}`}
                      </Typography>
                      <Chip
                        label={shipment.status}
                        color={shipment.status === 'DELIVERED' ? 'success' : shipment.status === 'SHIPPED' ? 'info' : 'warning'}
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={1} sx={{ color: '#9ca3af' }}>
                      <Grid item xs={5}>
                        <Typography variant="caption">Tracking Number</Typography>
                        <Typography variant="body2" fontWeight="bold" color="text.primary">
                          {shipment.trackingNumber}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography variant="caption">Courier</Typography>
                        <Typography variant="body2" color="text.primary">
                          {shipment.courier}
                        </Typography>
                      </Grid>
                      <Grid item xs={3}>
                        <Typography variant="caption">Last Update</Typography>
                        <Typography variant="body2" color="text.primary">
                          {new Date(shipment.updatedAt).toLocaleDateString()}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TrackingPage;
export type { Shipment };
