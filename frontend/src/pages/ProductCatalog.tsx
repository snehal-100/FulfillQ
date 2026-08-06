import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Container, Typography, Box, TextField, Chip, Button, Card, CardContent, CardMedia, Grid } from '@mui/material';
import { addToCart } from '../store/cartSlice';
import axios from 'axios';

interface Product {
  id: number;
  sku: string;
  name: string;
  price: number;
  brand: string;
  category: string;
  description: string;
  imageUrl: string;
}

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    sku: 'ZEN-LAP-016',
    name: 'ZenTech Laptop Pro 16',
    price: 109999,
    brand: 'ZenTech',
    category: 'Electronics',
    description: 'High-performance laptop featuring 32GB RAM and 1TB NVMe SSD.',
    imageUrl: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=500&q=80',
  },
  {
    id: 2,
    sku: 'WEAR-ULT-001',
    name: 'Smartwatch Ultra Pro',
    price: 24999,
    brand: 'Wearables',
    category: 'Gadgets',
    description: 'Advanced health tracking, built-in GPS, and 5-day battery life.',
    imageUrl: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&q=80',
  },
  {
    id: 3,
    sku: 'AUDIO-NCH-022',
    name: 'Studio Noise-Cancelling Headphones',
    price: 15999,
    brand: 'AudioTech',
    category: 'Audio',
    description: 'Active noise cancellation with 40-hour wireless playtime.',
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80',
  },
  {
    id: 4,
    sku: 'KEY-ERG-099',
    name: 'Ergonomic Mechanical Keyboard',
    price: 9999,
    brand: 'Keyboards',
    category: 'Peripherals',
    description: 'Split layout mechanical keyboard with quiet linear switches.',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=500&q=80',
  },
  {
    id: 5,
    sku: 'DISP-UW-034',
    name: 'UltraWide Curved Monitor 34"',
    price: 39999,
    brand: 'DisplayTech',
    category: 'Electronics',
    description: '34-inch curved monitor with 144Hz refresh rate and HDR10 support.',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80',
  },
  {
    id: 6,
    sku: 'HOME-AP-005',
    name: 'Smart Air Purifier X5',
    price: 19499,
    brand: 'HomePure',
    category: 'Home Appliances',
    description: 'True HEPA filter covering 500 sq ft with smart IoT speed control.',
    imageUrl: 'https://images.unsplash.com/photo-1621360841013-c7683c659ec6?w=500&q=80',
  },
  {
    id: 7,
    sku: 'HOME-VC-012',
    name: 'Cordless Vacuum Cleaner V12',
    price: 28999,
    brand: 'CleanSweep',
    category: 'Home Appliances',
    description: 'Lightweight cordless stick vacuum with 150AW powerful suction.',
    imageUrl: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=500&q=80',
  },
  {
    id: 8,
    sku: 'PER-MSE-502',
    name: 'Wireless Gaming Mouse G502',
    price: 6499,
    brand: 'LogiPlay',
    category: 'Peripherals',
    description: '25K DPI sub-micron tracking, custom RGB, and 11 programmable buttons.',
    imageUrl: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=500&q=80',
  },
  {
    id: 9,
    sku: 'AUD-EBD-009',
    name: 'ANC Wireless Earbuds Lite',
    price: 4999,
    brand: 'AudioTech',
    category: 'Audio',
    description: 'Compact IPX5 sweatproof earbuds with smart touch controls.',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&q=80',
  },
  {
    id: 10,
    sku: 'GAD-PBK-020',
    name: 'Portable Power Bank 20000mAh',
    price: 2499,
    brand: 'PowerUp',
    category: 'Gadgets',
    description: '22.5W fast charge power bank with dual USB-C output ports.',
    imageUrl: 'https://images.unsplash.com/photo-1619489646924-b4fce76b1db5?w=500&q=80',
  },
];

const ProductCatalog: React.FC = () => {
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showStockForId, setShowStockForId] = useState<number | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get('http://localhost:8080/api/inventory/products');
        if (res.data && res.data.length > 0) {
          setProducts(res.data);
        }
      } catch (err) {
        console.warn("Inventory API offline. Rendering fallback mock products.");
      }
    };
    fetchProducts();
  }, []);

  const handleAddToCart = (product: Product) => {
    dispatch(addToCart({
      id: product.id,
      sku: product.sku,
      name: product.name,
      price: product.price,
      quantity: 1,
    }));
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(products.map((p) => p.category)))];

  return (
    <Container sx={{ py: 6 }}>
      {/* Premium Hero Banner (Emerald & Cyan Theme Gradient) */}
      <Box 
        className="glass-panel" 
        sx={{ 
          p: { xs: 4, md: 6 }, 
          mb: 6, 
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.15) 100%)', 
          borderRadius: 4, 
          border: '1px solid rgba(16, 185, 129, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <Typography variant="h2" fontWeight="800" sx={{ fontFamily: 'Space Grotesk', mb: 2, background: 'linear-gradient(45deg, #a7f3d0, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            FulfillIQ Smart Store
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 700, mb: 4, fontWeight: 400, lineHeight: 1.6 }}>
            Distribute orders dynamically across 7 regional hubs. Real-time pessimistic stock locking ensures zero overselling and intelligent split routing.
          </Typography>
          
          <Grid container spacing={3} sx={{ mt: 2, maxWidth: 900 }}>
            {[
              { val: '7 Active', label: 'Regional Warehouses' },
              { val: '₹0 Split Cost', label: 'Optimized Distance routing' },
              { val: '100% Locked', label: 'Anti-Overselling Guard' },
              { val: '<45ms', label: 'Average Dispatch Sync' }
            ].map((stat, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#06b6d4', fontFamily: 'Space Grotesk' }}>
                  {stat.val}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {stat.label}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
        <Box sx={{ position: 'absolute', right: -50, bottom: -50, width: 300, height: 300, background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)', filter: 'blur(50px)', zIndex: 1 }} />
      </Box>

      {/* Modern Search & Categories Filters Container */}
      <Box sx={{ mb: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            label="Search Products or Brands"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            sx={{ flexGrow: 1, backgroundColor: 'rgba(255, 255, 255, 0.02)', borderRadius: 2 }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', py: 1, '&::-webkit-scrollbar': { display: 'none' } }}>
          {categories.map((cat) => (
            <Chip
              key={cat}
              label={cat}
              onClick={() => setCategory(cat)}
              variant={category === cat ? 'filled' : 'outlined'}
              sx={{
                background: category === cat ? 'linear-gradient(45deg, #10b981, #06b6d4)' : 'rgba(255,255,255,0.05)',
                color: category === cat ? '#fff' : 'text.secondary',
                borderColor: category === cat ? 'transparent' : 'rgba(255,255,255,0.1)',
                '&:hover': {
                  background: category === cat ? 'linear-gradient(45deg, #10b981, #06b6d4)' : 'rgba(255,255,255,0.1)',
                },
                fontSize: '0.85rem',
                py: 2,
                px: 1.5,
                fontWeight: 'bold',
                fontFamily: 'Outfit'
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Structured CSS Grid instead of Flexbox to resolve wrapping errors */}
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: 4
        }}
      >
        {filteredProducts.map((product) => (
          <Card 
            key={product.id}
            className="glass-panel" 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              background: 'rgba(8, 16, 28, 0.6)', 
              border: '1px solid rgba(16, 185, 129, 0.1)', 
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', 
              height: '100%',
              borderRadius: 4,
              overflow: 'hidden',
              '&:hover': { 
                transform: 'translateY(-5px)', 
                borderColor: 'rgba(6, 182, 212, 0.4)', 
                boxShadow: '0 8px 30px rgba(6, 182, 212, 0.15)' 
              } 
            }}
          >
            <CardMedia
              component="img"
              height="220"
              image={product.imageUrl}
              alt={product.name}
              sx={{ filter: 'brightness(0.9)' }}
            />
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 2, justifyContent: 'space-between', p: 3 }}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#06b6d4', fontWeight: 'bold', letterSpacing: '0.5px' }}>
                    {product.brand.toUpperCase()}
                  </Typography>
                  <Chip label={product.category} size="small" sx={{ background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontSize: '0.7rem', height: 20 }} />
                </Box>
                
                <Typography variant="h6" fontWeight="bold" component={Link} to={`/product/${product.id}`} style={{ textDecoration: 'none', color: '#f0fdf4', cursor: 'pointer', display: 'block', marginBottom: 8, fontFamily: 'Space Grotesk' }}>
                  {product.name}
                </Typography>

                <Typography variant="body2" sx={{ color: '#94a3b8', height: 42, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', fontSize: '0.85rem', lineHeight: 1.5 }}>
                  {product.description}
                </Typography>

                {/* Stock Inspector */}
                <Box sx={{ mt: 2.5 }}>
                  <Button 
                    variant="text" 
                    size="small" 
                    onClick={() => setShowStockForId(showStockForId === product.id ? null : product.id)}
                    sx={{ textTransform: 'none', color: '#34d399', p: 0, minWidth: 0, fontSize: '0.75rem', fontWeight: 'bold', '&:hover': { color: '#06b6d4' } }}
                  >
                    {showStockForId === product.id ? 'Hide Stock Info' : 'Check Stock by Warehouse...'}
                  </Button>
                  
                  {showStockForId === product.id && (
                    <Box sx={{ mt: 1.5, p: 2, borderRadius: 2, background: 'rgba(4, 8, 15, 0.8)', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
                      <Grid container spacing={1}>
                        {[
                          { name: 'Delhi Hub', stock: product.id === 1 ? 15 : product.id === 2 ? 80 : product.id === 7 ? 12 : 5 },
                          { name: 'Mumbai Terminal', stock: product.id === 1 ? 10 : product.id === 2 ? 35 : 0 },
                          { name: 'Bangalore Terminal', stock: product.id === 1 ? 0 : product.id === 2 ? 0 : 2 },
                          { name: 'Hyderabad Hub', stock: product.id === 1 ? 8 : product.id === 3 ? 45 : 10 },
                          { name: 'Kolkata Terminal', stock: product.id === 1 ? 3 : product.id === 3 ? 50 : 4 },
                          { name: 'Chennai Hub', stock: product.id === 1 ? 15 : product.id === 5 ? 20 : 6 },
                          { name: 'Pune Terminal', stock: product.id === 1 ? 2 : product.id === 6 ? 30 : 0 }
                        ].map((wh, idx) => (
                          <Grid item xs={6} key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{wh.name}:</Typography>
                            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: '0.7rem', color: wh.stock > 0 ? '#34d399' : '#f87171' }}>{wh.stock} units</Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </Box>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1, pt: 2, borderTop: '1px solid rgba(16, 185, 129, 0.08)' }}>
                <Typography variant="h6" fontWeight="bold" sx={{ color: '#06b6d4', fontFamily: 'Space Grotesk' }}>
                  ₹{product.price.toLocaleString('en-IN')}
                </Typography>
                <Button
                  variant="contained"
                  size="small"
                  onClick={() => handleAddToCart(product)}
                  sx={{ background: 'linear-gradient(45deg, #10b981, #06b6d4)', textTransform: 'none', px: 2.5, py: 0.8, borderRadius: 2, fontWeight: 'bold' }}
                >
                  Add to Cart
                </Button>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Container>
  );
};

export default ProductCatalog;
export type { Product };
