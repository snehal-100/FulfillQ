import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Container, Grid, Typography, Box, Button, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import { addToCart } from '../store/cartSlice';
import axios from 'axios';

interface WarehouseStock {
  id: number;
  warehouseId: number;
  productId: number;
  availableStock: number;
  reservedStock: number;
}

interface WarehouseDetails {
  id: number;
  name: string;
  address: string;
}

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<any>(null);
  const [stockDetails, setStockDetails] = useState<WarehouseStock[]>([]);
  const [warehouses, setWarehouses] = useState<Record<number, WarehouseDetails>>({
    1: { id: 1, name: 'Delhi Hub', address: 'Connaught Place, New Delhi' },
    2: { id: 2, name: 'Mumbai Terminal', address: 'Andheri East, Mumbai' },
    3: { id: 3, name: 'Bangalore Terminal', address: 'Koramangala, Bangalore' },
    4: { id: 4, name: 'Hyderabad Hub', address: 'Gachibowli, Hyderabad' },
    5: { id: 5, name: 'Kolkata Terminal', address: 'Salt Lake Sector V, Kolkata' },
    6: { id: 6, name: 'Chennai Hub', address: 'Guindy Industrial Estate, Chennai' },
    7: { id: 7, name: 'Pune Terminal', address: 'Hinjewadi Tech Park, Pune' },
  });
  const [qty, setQty] = useState(1);
  const dispatch = useDispatch();

  useEffect(() => {
    // 1. Fetch product
    const loadData = async () => {
      try {
        const prodRes = await axios.get(`http://localhost:8080/api/inventory/products/${id}`);
        setProduct(prodRes.data);
      } catch (err) {
        // Fallback Product Details
        const prod = [
          { id: 1, sku: 'ZEN-LAP-016', name: 'ZenTech Laptop Pro 16', price: 109999, brand: 'ZenTech', category: 'Electronics', description: 'High-performance laptop featuring 32GB RAM and 1TB NVMe SSD.' },
          { id: 2, sku: 'WEAR-ULT-001', name: 'Smartwatch Ultra Pro', price: 24999, brand: 'Wearables', category: 'Gadgets', description: 'Advanced health tracking, built-in GPS, and 5-day battery life.' },
          { id: 3, sku: 'AUDIO-NCH-022', name: 'Studio Noise-Cancelling Headphones', price: 15999, brand: 'AudioTech', category: 'Audio', description: 'Active noise cancellation with 40-hour wireless playtime.' },
          { id: 4, sku: 'KEY-ERG-099', name: 'Ergonomic Mechanical Keyboard', price: 9999, brand: 'Keyboards', category: 'Peripherals', description: 'Split layout mechanical keyboard with quiet linear switches.' },
          { id: 5, sku: 'DISP-UW-034', name: 'Curved UltraWide Monitor 34"', price: 39999, brand: 'DisplayTech', category: 'Electronics', description: '34-inch curved monitor with 144Hz refresh rate.' },
          { id: 6, sku: 'HOME-AP-005', name: 'Smart Air Purifier X5', price: 19499, brand: 'HomePure', category: 'Home Appliances', description: 'True HEPA filter covering 500 sq ft.' },
          { id: 7, sku: 'HOME-VC-012', name: 'Cordless Vacuum Cleaner V12', price: 28999, brand: 'CleanSweep', category: 'Home Appliances', description: 'Lightweight cordless stick vacuum.' },
          { id: 8, sku: 'PER-MSE-502', name: 'Wireless Gaming Mouse G502', price: 6499, brand: 'LogiPlay', category: 'Peripherals', description: '25K DPI sub-micron tracking.' },
          { id: 9, sku: 'AUD-EBD-009', name: 'ANC Wireless Earbuds Lite', price: 4999, brand: 'AudioTech', category: 'Audio', description: 'Compact IPX5 earbuds.' },
          { id: 10, sku: 'GAD-PBK-020', name: 'Portable Power Bank 20000mAh', price: 2499, brand: 'PowerUp', category: 'Gadgets', description: '22.5W fast charge power bank.' },
        ].find(p => p.id === Number(id));
        setProduct(prod);
      }

      // 2. Fetch stock levels
      try {
        const stockRes = await axios.get(`http://localhost:8080/api/inventory/product/${id}`);
        setStockDetails(stockRes.data);
      } catch (err) {
        // Fallback Mock stock details (different stocks for different warehouses)
        const mockStocks: WarehouseStock[] = [
          { id: 1, warehouseId: 1, productId: Number(id), availableStock: 15, reservedStock: 2 },
          { id: 2, warehouseId: 2, productId: Number(id), availableStock: 4, reservedStock: 0 },
          { id: 3, warehouseId: 3, productId: Number(id), availableStock: 0, reservedStock: 1 },
        ];
        setStockDetails(mockStocks);
      }

      // 3. Fetch warehouses to map names
      try {
        const whRes = await axios.get('http://localhost:8080/api/warehouses');
        const mapping: Record<number, WarehouseDetails> = {};
        whRes.data.forEach((w: any) => {
          mapping[w.id] = w;
        });
        setWarehouses(mapping);
      } catch (err) {
        // Keep default mock mapping
      }
    };

    loadData();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    dispatch(addToCart({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      quantity: qty,
    }));
  };

  if (!product) {
    return <Typography sx={{ p: 4, textAlign: 'center' }}>Loading product details...</Typography>;
  }

  const totalAvailable = stockDetails.reduce((sum, item) => sum + item.availableStock, 0);

  return (
    <Container sx={{ py: 6 }}>
      <Button component={Link} to="/" variant="outlined" sx={{ mb: 4 }}>
        &larr; Back to Catalog
      </Button>

      <Grid container spacing={6}>
        <Grid item xs={12} md={6}>
          <Box className="glass-panel" sx={{ p: 2, background: 'rgba(17, 24, 39, 0.5)' }}>
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80'}
              alt={product.name}
              style={{ width: '100%', borderRadius: '12px', height: '400px', objectFit: 'cover' }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#818cf8', fontWeight: 'bold' }}>
                {product.brand?.toUpperCase()}
              </Typography>
              <Typography variant="h3" fontWeight="bold" sx={{ fontFamily: 'Outfit' }}>
                {product.name}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                SKU: {product.sku}
              </Typography>
            </Box>

            <Typography variant="h4" fontWeight="bold" color="secondary.main">
              ₹{product.price.toLocaleString('en-IN')}
            </Typography>

            <Typography variant="body1" sx={{ color: '#9ca3af' }}>
              {product.description}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Stock Availability Across Warehouses
              </Typography>
              <TableContainer component={Paper} className="glass-panel" style={{ background: 'rgba(17, 24, 39, 0.4)' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Warehouse</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Available Stock</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Reserved Stock</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stockDetails.map((stock) => (
                      <TableRow key={stock.id}>
                        <TableCell>{warehouses[stock.warehouseId]?.name || `Warehouse ${stock.warehouseId}`}</TableCell>
                        <TableCell align="right">
                          <Chip
                            label={stock.availableStock > 0 ? stock.availableStock : 'Out of Stock'}
                            color={stock.availableStock > 0 ? 'success' : 'error'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right" style={{ color: '#9ca3af' }}>{stock.reservedStock}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mt: 4 }}>
              <TextField
                type="number"
                label="Quantity"
                size="small"
                inputProps={{ min: 1, max: totalAvailable }}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                disabled={totalAvailable <= 0}
                sx={{ width: 100 }}
              />
              <Button
                variant="contained"
                onClick={handleAddToCart}
                disabled={totalAvailable <= 0}
                sx={{
                  background: 'linear-gradient(45deg, #6366f1, #a855f7)',
                  px: 4,
                  py: 1.2,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                }}
              >
                {totalAvailable > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductDetails;
