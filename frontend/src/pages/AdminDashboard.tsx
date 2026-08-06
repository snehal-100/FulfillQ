import React, { useState, useEffect } from 'react';
import { Container, Tabs, Tab, Box, Typography, Card, CardContent, Grid, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TextField, Snackbar, Alert, CircularProgress, MenuItem, Chip } from '@mui/material';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
} from 'chart.js';
import axios from 'axios';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface Warehouse {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  capacity: number;
  managerId: number | null;
}

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  brand: string;
  category: string;
}

interface InventoryItem {
  id: number;
  warehouseId: number;
  productId: number;
  availableStock: number;
  reservedStock: number;
}

interface TransferItem {
  productId: number;
  quantity: number;
}

interface InventoryTransfer {
  id: number;
  fromWarehouseId: number;
  toWarehouseId: number;
  status: string;
  items: TransferItem[];
  createdAt: string;
  updatedAt: string;
}

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states - Warehouse Rebalancing
  const [transfers, setTransfers] = useState<InventoryTransfer[]>([]);
  const [tfFrom, setTfFrom] = useState('');
  const [tfTo, setTfTo] = useState('');
  const [tfProduct, setTfProduct] = useState('');
  const [tfQty, setTfQty] = useState('');

  // Form states - Warehouse
  const [whName, setWhName] = useState('');
  const [whLat, setWhLat] = useState('');
  const [whLon, setWhLon] = useState('');
  const [whAddress, setWhAddress] = useState('');
  const [whCapacity, setWhCapacity] = useState('');
  const [whManagerId, setWhManagerId] = useState('');

  // Form states - Product
  const [prodSku, setProdSku] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodBrand, setProdBrand] = useState('');
  const [prodCategory, setProdCategory] = useState('');
  const [prodDesc, setProdDesc] = useState('');

  // Form states - Restock
  const [restockWarehouse, setRestockWarehouse] = useState('');
  const [restockProduct, setRestockProduct] = useState('');
  const [restockQty, setRestockQty] = useState('');

  const [toastMsg, setToastMsg] = useState('');
  const [toastOpen, setToastOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastOpen(true);
  };

  const loadAllData = async () => {
    setLoading(true);
    // Load Warehouses
    try {
      const res = await axios.get('http://localhost:8080/api/warehouses');
      setWarehouses(res.data);
    } catch (err) {
      console.warn("Failed to load warehouses. Loading mock registry.");
      setWarehouses([
        { id: 1, name: 'Delhi Hub', latitude: 28.6304, longitude: 77.2177, address: 'Connaught Place, New Delhi', capacity: 10000, managerId: 10 },
        { id: 2, name: 'Mumbai Terminal', latitude: 19.0760, longitude: 72.8777, address: 'Andheri East, Mumbai', capacity: 15000, managerId: 11 },
        { id: 3, name: 'Bangalore Terminal', latitude: 12.9716, longitude: 77.5946, address: 'Koramangala, Bangalore', capacity: 12000, managerId: 12 },
        { id: 4, name: 'Hyderabad Hub', latitude: 17.3850, longitude: 78.4867, address: 'Gachibowli, Hyderabad', capacity: 14000, managerId: 13 },
        { id: 5, name: 'Kolkata Terminal', latitude: 22.5726, longitude: 88.3639, address: 'Salt Lake Sector V, Kolkata', capacity: 11000, managerId: 14 },
        { id: 6, name: 'Chennai Hub', latitude: 13.0827, longitude: 80.2707, address: 'Guindy Industrial Estate, Chennai', capacity: 13000, managerId: 15 },
        { id: 7, name: 'Pune Terminal', latitude: 18.5204, longitude: 73.8567, address: 'Hinjewadi Tech Park, Pune', capacity: 9000, managerId: 16 }
      ]);
    }

    // Load Products
    try {
      const res = await axios.get('http://localhost:8080/api/inventory/products');
      setProducts(res.data);
    } catch (err) {
      console.warn("Failed to load products. Loading mock product data.");
      setProducts([
        { id: 1, sku: 'ZEN-LAP-016', name: 'ZenTech Laptop Pro 16', price: 109999, brand: 'ZenTech', category: 'Electronics' },
        { id: 2, sku: 'WEAR-ULT-001', name: 'Smartwatch Ultra Pro', price: 24999, brand: 'Wearables', category: 'Gadgets' },
        { id: 3, sku: 'AUDIO-NCH-022', name: 'Studio Noise-Cancelling Headphones', price: 15999, brand: 'AudioTech', category: 'Audio' },
        { id: 4, sku: 'KEY-ERG-099', name: 'Ergonomic Mechanical Keyboard', price: 9999, brand: 'Keyboards', category: 'Peripherals' },
        { id: 5, sku: 'DISP-UW-034', name: 'UltraWide Curved Monitor 34"', price: 39999, brand: 'DisplayTech', category: 'Electronics' },
        { id: 6, sku: 'HOME-AP-005', name: 'Smart Air Purifier X5', price: 19499, brand: 'HomePure', category: 'Home Appliances' },
        { id: 7, sku: 'HOME-VC-012', name: 'Cordless Vacuum Cleaner V12', price: 28999, brand: 'CleanSweep', category: 'Home Appliances' },
        { id: 8, sku: 'PER-MSE-502', name: 'Wireless Gaming Mouse G502', price: 6499, brand: 'LogiPlay', category: 'Peripherals' },
        { id: 9, sku: 'AUD-EBD-009', name: 'ANC Wireless Earbuds Lite', price: 4999, brand: 'AudioTech', category: 'Audio' },
        { id: 10, sku: 'GAD-PBK-020', name: 'Portable Power Bank 20000mAh', price: 2499, brand: 'PowerUp', category: 'Gadgets' },
      ]);
    }

    // Load Inventory per Warehouse
    try {
      const res1 = await axios.get('http://localhost:8080/api/inventory/warehouse/1');
      const res2 = await axios.get('http://localhost:8080/api/inventory/warehouse/2');
      const res3 = await axios.get('http://localhost:8080/api/inventory/warehouse/3');
      setInventory([...res1.data, ...res2.data, ...res3.data]);
    } catch (err) {
      const storedInv = localStorage.getItem('fulfilliq_inventory');
      if (storedInv) {
        setInventory(JSON.parse(storedInv));
      } else {
        setInventory([
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
          { id: 12, warehouseId: 1, productId: 7, availableStock: 12, reservedStock: 0 },
        ]);
      }
    }

    // Load Transfers
    try {
      const res = await axios.get('http://localhost:8080/api/inventory/transfers');
      setTransfers(res.data);
    } catch (err) {
      const storedTransfers = localStorage.getItem('fulfilliq_transfers');
      if (storedTransfers) {
        setTransfers(JSON.parse(storedTransfers));
      } else {
        setTransfers([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCityPreFill = (city: string) => {
    const cityData: Record<string, { lat: number; lon: number; address: string; nameSuffix: string }> = {
      Delhi: { lat: 28.6139, lon: 77.2090, address: "Sector 18, Noida, Delhi NCR", nameSuffix: "Delhi Hub" },
      Mumbai: { lat: 19.0760, lon: 72.8777, address: "Bandra Kurla Complex, Mumbai", nameSuffix: "Mumbai Terminal" },
      Bangalore: { lat: 12.9716, lon: 77.5946, address: "Electronic City, Bangalore", nameSuffix: "Bangalore Terminal" },
      Hyderabad: { lat: 17.3850, lon: 78.4867, address: "Hi-Tech City, Hyderabad", nameSuffix: "Hyderabad Hub" },
      Chennai: { lat: 13.0827, lon: 80.2707, address: "Guindy Industrial Estate, Chennai", nameSuffix: "Chennai Hub" },
      Kolkata: { lat: 22.5726, lon: 88.3639, address: "Salt Lake Sector V, Kolkata", nameSuffix: "Kolkata Hub" },
      Pune: { lat: 18.5204, lon: 73.8567, address: "Hinjewadi Tech Park, Pune", nameSuffix: "Pune Terminal" },
    };

    const data = cityData[city];
    if (data) {
      setWhLat(data.lat.toString());
      setWhLon(data.lon.toString());
      setWhAddress(data.address);
      setWhName(data.nameSuffix);
      showToast(`${city} city coordinates pre-filled successfully!`);
    }
  };

  const handleDetectLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setWhLat(position.coords.latitude.toString());
          setWhLon(position.coords.longitude.toString());
          showToast("GPS coordinates auto-detected successfully!");
        },
        (error) => {
          console.error("Geolocation failed", error);
          showToast("Geolocation failed: Please allow browser location access.");
        }
      );
    } else {
      showToast("Geolocation is not supported by this browser.");
    }
  };

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: whName,
      latitude: parseFloat(whLat),
      longitude: parseFloat(whLon),
      address: whAddress,
      capacity: parseInt(whCapacity),
      managerId: whManagerId ? parseInt(whManagerId) : null
    };

    try {
      await axios.post('http://localhost:8080/api/warehouses', payload);
      showToast("Warehouse registered successfully!");
      loadAllData();
    } catch (err) {
      console.warn("Backend offline. Simulating local warehouse add.");
      const mockId = warehouses.length + 1;
      setWarehouses([...warehouses, { id: mockId, ...payload }]);
      showToast("[MOCK SUCCESS] Warehouse registered locally!");
    }
    setWhName(''); setWhLat(''); setWhLon(''); setWhAddress(''); setWhCapacity(''); setWhManagerId('');
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      sku: prodSku,
      name: prodName,
      price: parseFloat(prodPrice),
      brand: prodBrand,
      category: prodCategory,
      description: prodDesc,
      imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80'
    };

    try {
      await axios.post('http://localhost:8080/api/inventory/products', payload);
      showToast("Product registered successfully!");
      loadAllData();
    } catch (err) {
      console.warn("Backend offline. Simulating local product catalog addition.");
      const mockId = products.length + 1;
      setProducts([...products, { id: mockId, ...payload }]);
      showToast("[MOCK SUCCESS] Product registered locally!");
    }
    setProdSku(''); setProdName(''); setProdPrice(''); setProdBrand(''); setProdCategory(''); setProdDesc('');
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    const whId = parseInt(restockWarehouse);
    const prodId = parseInt(restockProduct);
    const qty = parseInt(restockQty);

    try {
      await axios.post('http://localhost:8080/api/inventory/add', {
        warehouseId: whId,
        productId: prodId,
        quantity: qty,
        reason: "ADMIN_MANUAL_RESTOCK"
      });
      showToast("Inventory stock added successfully!");
      loadAllData();
    } catch (err) {
      console.warn("Backend offline. Simulating local stock increment.");
      const existing = inventory.find(i => i.warehouseId === whId && i.productId === prodId);
      if (existing) {
        setInventory(inventory.map(i => i.id === existing.id ? { ...i, availableStock: i.availableStock + qty } : i));
      } else {
        const mockId = inventory.length + 1;
        setInventory([...inventory, { id: mockId, warehouseId: whId, productId: prodId, availableStock: qty, reservedStock: 0 }]);
      }
      showToast("[MOCK SUCCESS] Shelf stock added locally!");
    }
    setRestockQty('');
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const fromId = parseInt(tfFrom);
    const toId = parseInt(tfTo);
    const prodId = parseInt(tfProduct);
    const qty = parseInt(tfQty);

    if (fromId === toId) {
      showToast("Source and destination warehouses must be different!");
      return;
    }

    const payload = {
      fromWarehouseId: fromId,
      toWarehouseId: toId,
      items: [{ productId: prodId, quantity: qty }]
    };

    try {
      await axios.post('http://localhost:8080/api/inventory/transfers', payload);
      showToast("Stock transfer requested successfully!");
      loadAllData();
    } catch (err) {
      console.warn("Backend offline. Simulating local transfer draft.");
      const mockId = 500 + (transfers.length + 1);
      const newTransfer: InventoryTransfer = {
        id: mockId,
        fromWarehouseId: fromId,
        toWarehouseId: toId,
        status: 'PENDING',
        items: [{ productId: prodId, quantity: qty }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedTransfers = [newTransfer, ...transfers];
      setTransfers(updatedTransfers);
      localStorage.setItem('fulfilliq_transfers', JSON.stringify(updatedTransfers));
      showToast("[MOCK SUCCESS] Stock transfer requested locally!");
    }
    setTfQty('');
  };

  // Chart configs
  const ordersPerDayData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Fulfillment Handled',
      data: [65, 82, 70, 95, 110, 85, 90],
      backgroundColor: 'rgba(16, 185, 129, 0.45)',
      borderColor: '#10b981',
      borderWidth: 2,
      borderRadius: 6
    }]
  };

  const splitPercentageData = {
    labels: ['Single Sourced', 'Split Sourced (Multi-WH)'],
    datasets: [{
      data: [68, 32],
      backgroundColor: ['#10b981', '#06b6d4'],
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1
    }]
  };

  const warehouseUtilizationData = {
    labels: warehouses.map(w => w.name),
    datasets: [{
      data: warehouses.map(w => {
        const totalStock = inventory.filter(i => i.warehouseId === w.id).reduce((acc, curr) => acc + curr.availableStock, 0);
        return totalStock;
      }),
      backgroundColor: ['#10b981', '#06b6d4', '#14b8a6', '#34d399', '#2dd4bf', '#059669', '#0891b2'],
      borderColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1
    }]
  };

  const lowStockAlerts = inventory.filter(item => item.availableStock < 5);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Container sx={{ py: 6 }}>
      <Box sx={{ mb: 5 }}>
        <Typography variant="h3" fontWeight="bold" sx={{ fontFamily: 'Space Grotesk', mb: 1 }}>
          Administrator Console
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Global supply control routing, catalog definitions, and real-time inventory ledger metrics.
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'rgba(16, 185, 129, 0.15)', mb: 4 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, val) => setActiveTab(val)} 
          textColor="inherit" 
          indicatorColor="primary"
          sx={{
            '& .MuiTab-root': { fontFamily: 'Space Grotesk', fontWeight: 'bold' }
          }}
        >
          <Tab label="Analytics Dashboard" />
          <Tab label="Warehouse Management" />
          <Tab label="Inventory Manager" />
          <Tab label="Product Catalog" />
          <Tab label="Warehouse Rebalancing" />
        </Tabs>
      </Box>

      {/* TAB 0: ANALYTICS */}
      {activeTab === 0 && (
        <Grid container spacing={4}>
          {/* KPI CARDS CONTAINER */}
          <Grid item xs={12}>
            <Grid container spacing={3}>
              {[
                { title: 'Total Catalog Products', value: `${products.length} Items`, detail: '6 Categories active', color: '#10b981' },
                { title: 'Global Sourced Inventory', value: `${inventory.reduce((a, b) => a + b.availableStock, 0)} Units`, detail: 'Spread across 7 hubs', color: '#06b6d4' },
                { title: 'Split Routing Efficiency', value: '98.6%', detail: 'Proximity-optimized dispatches', color: '#34d399' },
                { title: 'System Engine Sync', value: 'Active', detail: 'WebSocket Event Stream active', color: '#fbbf24' }
              ].map((kpi, idx) => (
                <Grid item xs={12} sm={6} md={3} key={idx}>
                  <Card className="glass-panel" sx={{ background: 'rgba(8, 16, 28, 0.6)', border: `1px solid ${kpi.color}25` }}>
                    <CardContent sx={{ py: 2.5 }}>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{kpi.title}</Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ color: kpi.color, fontFamily: 'Space Grotesk', mt: 1 }}>{kpi.value}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>{kpi.detail}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>

          <Grid item xs={12} md={4}>
            <Card className="glass-panel" sx={{ background: 'rgba(8, 16, 28, 0.5)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Space Grotesk' }}>Orders per Day</Typography>
                <Bar data={ordersPerDayData} />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card className="glass-panel" sx={{ background: 'rgba(8, 16, 28, 0.5)' }}>
              <CardContent sx={{ textAlign: 'center', height: '100%' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Space Grotesk' }}>Fulfillment Splits (%)</Typography>
                <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                  <Pie data={splitPercentageData} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card className="glass-panel" sx={{ background: 'rgba(8, 16, 28, 0.5)' }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Space Grotesk' }}>Warehouse Utilization (Units)</Typography>
                <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                  <Doughnut data={warehouseUtilizationData} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* LOW STOCK ALERTS */}
          <Grid item xs={12}>
            <Card className="glass-panel" sx={{ background: 'rgba(248, 113, 113, 0.05)', borderColor: 'rgba(248, 113, 113, 0.2)' }}>
              <CardContent>
                <Typography variant="subtitle1" color="error" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Space Grotesk' }}>
                  ⚠️ Critical Low Stock Warnings
                </Typography>
                <TableContainer component={Paper} sx={{ background: 'transparent' }} elevation={0}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ color: '#f87171', fontWeight: 'bold' }}>Warehouse</TableCell>
                        <TableCell sx={{ color: '#f87171', fontWeight: 'bold' }}>Product SKU</TableCell>
                        <TableCell sx={{ color: '#f87171', fontWeight: 'bold' }}>Product Name</TableCell>
                        <TableCell align="right" sx={{ color: '#f87171', fontWeight: 'bold' }}>Stock Available</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStockAlerts.map((lowItem) => {
                        const wh = warehouses.find(w => w.id === lowItem.warehouseId);
                        const prod = products.find(p => p.id === lowItem.productId);
                        return (
                          <TableRow key={lowItem.id} sx={{ '&:hover': { background: 'rgba(248,113,113,0.05)' } }}>
                            <TableCell>{wh?.name || `Warehouse ${lowItem.warehouseId}`}</TableCell>
                            <TableCell>{prod?.sku || 'SKU-UNKNOWN'}</TableCell>
                            <TableCell>{prod?.name || 'PRODUCT-UNKNOWN'}</TableCell>
                            <TableCell align="right" style={{ color: '#f87171', fontWeight: 'bold' }}>{lowItem.availableStock}</TableCell>
                          </TableRow>
                        );
                      })}
                      {lowStockAlerts.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 2 }}>
                            All items are stocked above critical thresholds.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 1: WAREHOUSE MANAGEMENT */}
      {activeTab === 1 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '350px 1fr' }, gap: 4, alignItems: 'start' }}>
            <Card className="glass-panel" sx={{ background: 'rgba(8, 16, 28, 0.5)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Space Grotesk', color: '#10b981', mb: 3 }}>
                  Register New Warehouse
                </Typography>
                <Box component="form" onSubmit={handleCreateWarehouse} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    select
                    label="Quick City Prefill Helper"
                    variant="outlined"
                    size="small"
                    value=""
                    onChange={(e) => handleCityPreFill(e.target.value)}
                  >
                    <MenuItem value="Delhi">Delhi</MenuItem>
                    <MenuItem value="Mumbai">Mumbai</MenuItem>
                    <MenuItem value="Bangalore">Bangalore</MenuItem>
                    <MenuItem value="Hyderabad">Hyderabad</MenuItem>
                    <MenuItem value="Chennai">Chennai</MenuItem>
                    <MenuItem value="Kolkata">Kolkata</MenuItem>
                    <MenuItem value="Pune">Pune</MenuItem>
                  </TextField>

                  <Button 
                    type="button" 
                    variant="outlined" 
                    size="small" 
                    onClick={handleDetectLocation}
                    sx={{ textTransform: 'none', borderStyle: 'dashed', py: 1 }}
                  >
                    Auto-Detect Coordinates (GPS)
                  </Button>

                  <TextField label="Name" variant="outlined" size="small" required value={whName} onChange={(e) => setWhName(e.target.value)} />
                  <TextField label="Latitude" variant="outlined" size="small" type="number" inputProps={{ step: "any" }} required value={whLat} onChange={(e) => setWhLat(e.target.value)} />
                  <TextField label="Longitude" variant="outlined" size="small" type="number" inputProps={{ step: "any" }} required value={whLon} onChange={(e) => setWhLon(e.target.value)} />
                  <TextField label="Address" variant="outlined" size="small" required value={whAddress} onChange={(e) => setWhAddress(e.target.value)} />
                  <TextField label="Capacity (units)" variant="outlined" size="small" type="number" required value={whCapacity} onChange={(e) => setWhCapacity(e.target.value)} />
                  <TextField label="Manager ID" variant="outlined" size="small" type="number" value={whManagerId} onChange={(e) => setWhManagerId(e.target.value)} />
                  <Button type="submit" variant="contained" sx={{ background: 'linear-gradient(45deg, #10b981, #06b6d4)', py: 1, fontWeight: 'bold' }}>
                    Register Warehouse
                  </Button>
                </Box>
              </CardContent>
            </Card>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Space Grotesk' }}>Warehouse Registry</Typography>
            <TableContainer component={Paper} className="glass-panel" sx={{ background: 'rgba(8, 16, 28, 0.5)' }} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Coordinates</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Address</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#10b981' }}>Capacity</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Manager ID</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {warehouses.map((wh) => (
                    <TableRow key={wh.id} sx={{ '&:hover': { background: 'rgba(16, 185, 129, 0.03)' } }}>
                      <TableCell>{wh.id}</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>{wh.name}</TableCell>
                      <TableCell>{wh.latitude.toFixed(4)}, {wh.longitude.toFixed(4)}</TableCell>
                      <TableCell>{wh.address}</TableCell>
                      <TableCell align="right">{wh.capacity.toLocaleString()}</TableCell>
                      <TableCell>{wh.managerId || 'None Assigned'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}

      {/* TAB 2: INVENTORY MANAGER */}
      {activeTab === 2 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '350px 1fr' }, gap: 4, alignItems: 'start' }}>
            <Card className="glass-panel" sx={{ background: 'rgba(8, 16, 28, 0.5)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Space Grotesk', color: '#10b981', mb: 3 }}>
                  Manual Restock Operations
                </Typography>
                <Box component="form" onSubmit={handleRestock} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    select
                    label="Select Warehouse"
                    size="small"
                    required
                    value={restockWarehouse}
                    onChange={(e) => setRestockWarehouse(e.target.value)}
                  >
                    {warehouses.map((wh) => (
                      <MenuItem key={wh.id} value={wh.id}>{wh.name}</MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    select
                    label="Select Product"
                    size="small"
                    required
                    value={restockProduct}
                    onChange={(e) => setRestockProduct(e.target.value)}
                  >
                    {products.map((p) => (
                      <MenuItem key={p.id} value={p.id}>{p.name} ({p.sku})</MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    label="Add Quantity"
                    variant="outlined"
                    size="small"
                    type="number"
                    required
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                  />

                  <Button type="submit" variant="contained" sx={{ background: 'linear-gradient(45deg, #10b981, #06b6d4)', py: 1, fontWeight: 'bold' }}>
                    Add Stock
                  </Button>
                </Box>
              </CardContent>
            </Card>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Space Grotesk' }}>Stock Ledger</Typography>
            <TableContainer component={Paper} className="glass-panel" sx={{ background: 'rgba(8, 16, 28, 0.5)' }} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Warehouse</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Product SKU</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Product Name</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#10b981', width: '180px' }}>Stock Level</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#10b981' }}>Available</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#10b981' }}>Reserved</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.map((inv) => {
                    const wh = warehouses.find(w => w.id === inv.warehouseId);
                    const prod = products.find(p => p.id === inv.productId);
                    
                    // Capacity percentage visual indicator
                    const percent = Math.min((inv.availableStock / 60) * 100, 100);
                    const barColor = inv.availableStock < 5 ? '#f87171' : inv.availableStock < 20 ? '#fbbf24' : '#34d399';

                    return (
                      <TableRow key={inv.id} sx={{ '&:hover': { background: 'rgba(16, 185, 129, 0.03)' } }}>
                        <TableCell>{wh?.name || `Warehouse ${inv.warehouseId}`}</TableCell>
                        <TableCell>{prod?.sku || 'SKU-UNKNOWN'}</TableCell>
                        <TableCell style={{ fontWeight: 'bold' }}>{prod?.name || 'PRODUCT-UNKNOWN'}</TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box sx={{ flexGrow: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
                              <Box sx={{ height: '100%', width: `${percent}%`, background: barColor, borderRadius: 3 }} />
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right" style={{ fontWeight: 'bold' }}>{inv.availableStock}</TableCell>
                        <TableCell align="right" style={{ color: '#94a3b8' }}>{inv.reservedStock}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}

      {/* TAB 3: PRODUCT CATALOG */}
      {activeTab === 3 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '350px 1fr' }, gap: 4, alignItems: 'start' }}>
            <Card className="glass-panel" sx={{ background: 'rgba(8, 16, 28, 0.5)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Space Grotesk', color: '#10b981', mb: 3 }}>
                  Register New Catalog Product
                </Typography>
                <Box component="form" onSubmit={handleCreateProduct} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField label="SKU" variant="outlined" size="small" required value={prodSku} onChange={(e) => setProdSku(e.target.value)} />
                  <TextField label="Name" variant="outlined" size="small" required value={prodName} onChange={(e) => setProdName(e.target.value)} />
                  <TextField label="Price" variant="outlined" size="small" type="number" inputProps={{ step: "0.01" }} required value={prodPrice} onChange={(e) => setProdPrice(e.target.value)} />
                  <TextField label="Brand" variant="outlined" size="small" required value={prodBrand} onChange={(e) => setProdBrand(e.target.value)} />
                  <TextField label="Category" variant="outlined" size="small" required value={prodCategory} onChange={(e) => setProdCategory(e.target.value)} />
                  <TextField label="Description" variant="outlined" size="small" multiline rows={2} value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} />
                  <Button type="submit" variant="contained" sx={{ background: 'linear-gradient(45deg, #10b981, #06b6d4)', py: 1, fontWeight: 'bold' }}>
                    Add to Catalog
                  </Button>
                </Box>
              </CardContent>
            </Card>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Space Grotesk' }}>Product Registry</Typography>
            <TableContainer component={Paper} className="glass-panel" sx={{ background: 'rgba(8, 16, 28, 0.5)' }} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>SKU</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Name</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Brand</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Category</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#10b981' }}>Price</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {products.map((p) => (
                    <TableRow key={p.id} sx={{ '&:hover': { background: 'rgba(16, 185, 129, 0.03)' } }}>
                      <TableCell>{p.sku}</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>{p.name}</TableCell>
                      <TableCell>{p.brand}</TableCell>
                      <TableCell>
                        <Chip label={p.category} size="small" sx={{ background: 'rgba(6, 182, 212, 0.1)', color: '#67e8f9', fontSize: '0.7rem', fontWeight: 'bold' }} />
                      </TableCell>
                      <TableCell align="right" style={{ fontWeight: 'bold', color: '#34d399' }}>₹{p.price.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}

      {/* TAB 4: WAREHOUSE REBALANCING */}
      {activeTab === 4 && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '350px 1fr' }, gap: 4, alignItems: 'start' }}>
          <Card className="glass-panel" sx={{ background: 'rgba(8, 16, 28, 0.5)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Space Grotesk', color: '#10b981', mb: 3 }}>
                Draft Stock Rebalance
              </Typography>
              <Box component="form" onSubmit={handleCreateTransfer} sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                <TextField
                  select
                  label="From Source Warehouse"
                  variant="outlined"
                  size="small"
                  required
                  value={tfFrom}
                  onChange={(e) => setTfFrom(e.target.value)}
                >
                  {warehouses.map(w => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="To Destination Warehouse"
                  variant="outlined"
                  size="small"
                  required
                  value={tfTo}
                  onChange={(e) => setTfTo(e.target.value)}
                >
                  {warehouses.map(w => (
                    <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Select Product to Move"
                  variant="outlined"
                  size="small"
                  required
                  value={tfProduct}
                  onChange={(e) => setTfProduct(e.target.value)}
                >
                  {products.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.name} ({p.sku})</MenuItem>
                  ))}
                </TextField>

                <TextField
                  label="Quantity to Transfer"
                  variant="outlined"
                  size="small"
                  type="number"
                  required
                  value={tfQty}
                  onChange={(e) => setTfQty(e.target.value)}
                />

                <Button type="submit" variant="contained" sx={{ background: 'linear-gradient(45deg, #10b981, #06b6d4)', py: 1, fontWeight: 'bold' }}>
                  Initialize Rebalance
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontFamily: 'Space Grotesk' }}>Transfer Request History</Typography>
            <TableContainer component={Paper} className="glass-panel" sx={{ background: 'rgba(8, 16, 28, 0.5)' }} elevation={0}>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Route</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Items</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#10b981' }}>Date Created</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold', color: '#10b981' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transfers.map((t) => {
                    const fromWh = warehouses.find(w => w.id === t.fromWarehouseId)?.name || `WH ${t.fromWarehouseId}`;
                    const toWh = warehouses.find(w => w.id === t.toWarehouseId)?.name || `WH ${t.toWarehouseId}`;
                    return (
                      <TableRow key={t.id} sx={{ '&:hover': { background: 'rgba(16, 185, 129, 0.03)' } }}>
                        <TableCell>#{t.id}</TableCell>
                        <TableCell style={{ fontWeight: 'bold' }}>
                          <span style={{ color: '#f87171' }}>{fromWh}</span> ➔ <span style={{ color: '#34d399' }}>{toWh}</span>
                        </TableCell>
                        <TableCell>
                          {t.items.map((item, index) => {
                            const pName = products.find(p => p.id === item.productId)?.name || `Prod ${item.productId}`;
                            return <div key={index}>{pName} (x{item.quantity})</div>;
                          })}
                        </TableCell>
                        <TableCell>{new Date(t.createdAt).toLocaleString('en-IN')}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={t.status}
                            size="small"
                            sx={{
                              fontWeight: 'bold',
                              fontSize: '0.75rem',
                              background: t.status === 'RECEIVED' ? 'rgba(16, 185, 129, 0.1)' :
                                         t.status === 'IN_TRANSIT' ? 'rgba(245, 158, 11, 0.1)' :
                                         t.status === 'PENDING' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: t.status === 'RECEIVED' ? '#34d399' :
                                     t.status === 'IN_TRANSIT' ? '#fbbf24' :
                                     t.status === 'PENDING' ? '#60a5fa' : '#f87171',
                              borderColor: 'transparent'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {transfers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                        No warehouse rebalancing actions requested.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default AdminDashboard;
