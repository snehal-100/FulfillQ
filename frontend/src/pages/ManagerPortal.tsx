import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Container, Grid, Typography, Box, Tabs, Tab, Card, CardContent, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, TextField, IconButton, MenuItem } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { type RootState } from '../store';
import axios from 'axios';

interface Shipment {
  id: number;
  orderId: number;
  warehouseId: number;
  trackingNumber: string;
  courier: string;
  status: 'PACKED' | 'SHIPPED' | 'DELIVERED';
  updatedAt: string;
}

interface StockItem {
  id: number;
  warehouseId: number;
  productId: number;
  availableStock: number;
  reservedStock: number;
}

const ManagerPortal: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState(0);
  const [warehouseId, setWarehouseId] = useState<number>(1); // Default Delhi Hub
  const [warehouseName, setWarehouseName] = useState('Delhi Hub');
  
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [products, setProducts] = useState<Record<number, any>>({
    1: { id: 1, sku: 'ZEN-LAP-016', name: 'ZenTech Laptop Pro 16', price: 109999 },
    2: { id: 2, sku: 'WEAR-ULT-001', name: 'Smartwatch Ultra Pro', price: 24999 },
    3: { id: 3, sku: 'AUDIO-NCH-022', name: 'Noise-Cancelling Headphones', price: 15999 },
  });

  const [editingStockId, setEditingStockId] = useState<number | null>(null);
  const [editingQty, setEditingQty] = useState<string>('');
  const [transfers, setTransfers] = useState<any[]>([]);

  const loadManagerData = async () => {
    // 1. Fetch warehouse assigned to this manager
    const managerId = user?.id || 10;
    try {
      const whRes = await axios.get(`http://localhost:8080/api/warehouses/manager/${managerId}`);
      setWarehouseId(whRes.data.id);
      setWarehouseName(whRes.data.name);
    } catch (err) {
      console.warn("Could not determine manager warehouse from API. Using default mapping.");
      const mockNames: Record<number, string> = {
        1: 'Delhi Hub',
        2: 'Mumbai Terminal',
        3: 'Bangalore Terminal',
        4: 'Hyderabad Hub',
        5: 'Kolkata Terminal'
      };
      setWarehouseName(mockNames[warehouseId] || 'Delhi Hub');
    }

    // 2. Fetch shipments for this warehouse
    try {
      const shipRes = await axios.get(`http://localhost:8080/api/shipping/warehouse/${warehouseId}`);
      setShipments(shipRes.data);
    } catch (err) {
      console.warn("Could not load real shipments. Using localStorage mock data.");
      const stored = localStorage.getItem('fulfilliq_shipments');
      if (stored) {
        setShipments(JSON.parse(stored).filter((s: any) => s.warehouseId === warehouseId));
      } else {
        setShipments([
          { id: 201, orderId: 101, warehouseId: warehouseId, trackingNumber: 'FIQ-8AD47F9', courier: 'FedEx', status: 'DELIVERED', updatedAt: '2026-08-05T12:00:00' },
          { id: 202, orderId: 102, warehouseId: warehouseId, trackingNumber: 'FIQ-7AD99C2', courier: 'UPS', status: 'PACKED', updatedAt: '2026-08-06T09:00:00' },
        ]);
      }
    }

    // 3. Fetch products mapping
    try {
      const prodRes = await axios.get('http://localhost:8080/api/inventory/products');
      const prodMap: Record<number, any> = {};
      prodRes.data.forEach((p: any) => {
        prodMap[p.id] = p;
      });
      setProducts(prodMap);
    } catch (err) {
      // Keep mock product mapping
    }

    // 4. Fetch stock for this warehouse
    try {
      const stockRes = await axios.get(`http://localhost:8080/api/inventory/warehouse/${warehouseId}`);
      setStocks(stockRes.data);
    } catch (err) {
      const stored = localStorage.getItem('fulfilliq_inventory');
      if (stored) {
        setStocks(JSON.parse(stored).filter((s: any) => s.warehouseId === warehouseId));
      } else {
        setStocks([
          { id: 1, warehouseId: warehouseId, productId: 1, availableStock: 800, reservedStock: 2 },
          { id: 4, warehouseId: warehouseId, productId: 2, availableStock: 80, reservedStock: 10 },
          { id: 6, warehouseId: warehouseId, productId: 3, availableStock: 2, reservedStock: 0 },
        ]);
      }
    }

    // 5. Fetch transfers associated with this warehouse
    try {
      const transRes = await axios.get(`http://localhost:8080/api/inventory/transfers/warehouse/${warehouseId}`);
      setTransfers(transRes.data);
    } catch (err) {
      const storedTrans = localStorage.getItem('fulfilliq_transfers');
      if (storedTrans) {
        setTransfers(JSON.parse(storedTrans).filter((t: any) => t.fromWarehouseId === warehouseId || t.toWarehouseId === warehouseId));
      } else {
        setTransfers([]);
      }
    }
  };

  useEffect(() => {
    loadManagerData();
  }, [warehouseId, user]);

  const handleUpdateStatus = async (shipmentId: number, nextStatus: 'SHIPPED' | 'DELIVERED') => {
    try {
      await axios.put(`http://localhost:8080/api/shipping/${shipmentId}/status`, { status: nextStatus });
      loadManagerData();
    } catch (err) {
      console.warn("Backend offline. Simulating shipment update in localStorage.");
      
      // 1. Update localStorage shipments
      const storedShipments = localStorage.getItem('fulfilliq_shipments');
      let orderIdToUpdate: number | null = null;
      if (storedShipments) {
        const list = JSON.parse(storedShipments);
        const updatedList = list.map((s: any) => {
          if (s.id === shipmentId) {
            orderIdToUpdate = s.orderId;
            return { ...s, status: nextStatus, updatedAt: new Date().toISOString() };
          }
          return s;
        });
        localStorage.setItem('fulfilliq_shipments', JSON.stringify(updatedList));
      }

      // 2. Sync corresponding customer order status
      if (orderIdToUpdate) {
        const storedOrders = localStorage.getItem('fulfilliq_orders');
        const storedAllShipments = localStorage.getItem('fulfilliq_shipments');
        if (storedOrders && storedAllShipments) {
          const orders = JSON.parse(storedOrders);
          const shipments = JSON.parse(storedAllShipments);
          
          const orderShipments = shipments.filter((s: any) => s.orderId === orderIdToUpdate);
          
          let finalOrderStatus = 'RESERVED';
          if (orderShipments.length > 0) {
            const allDelivered = orderShipments.every((s: any) => s.status === 'DELIVERED');
            const anyShippedOrDelivered = orderShipments.some((s: any) => s.status === 'SHIPPED' || s.status === 'DELIVERED');
            if (allDelivered) {
              finalOrderStatus = 'DELIVERED';
            } else if (anyShippedOrDelivered) {
              finalOrderStatus = 'SHIPPED';
            }
          }
          
          const updatedOrders = orders.map((o: any) => {
            if (o.id === orderIdToUpdate) {
              return { ...o, status: finalOrderStatus };
            }
            return o;
          });
          localStorage.setItem('fulfilliq_orders', JSON.stringify(updatedOrders));
        }
      }
      loadManagerData();
    }
  };

  const handleEditStock = (stock: StockItem) => {
    setEditingStockId(stock.id);
    setEditingQty(stock.availableStock.toString());
  };

  const handleSaveStock = async (stock: StockItem) => {
    const qty = parseInt(editingQty);
    const difference = qty - stock.availableStock;
    if (isNaN(difference)) return;

    try {
      await axios.post('http://localhost:8080/api/inventory/add', {
        warehouseId: warehouseId,
        productId: stock.productId,
        quantity: difference,
        reason: "MANAGER_INLINE_CORRECTION"
      });
      loadManagerData();
    } catch (err) {
      console.warn("Backend offline. Simulating stock adjustment.");
      // Update inventory in localStorage
      const stored = localStorage.getItem('fulfilliq_inventory');
      if (stored) {
        const inv = JSON.parse(stored);
        const updated = inv.map((s: any) => s.warehouseId === warehouseId && s.productId === stock.productId ? { ...s, availableStock: qty } : s);
        localStorage.setItem('fulfilliq_inventory', JSON.stringify(updated));
      }
      setStocks(stocks.map(s => s.id === stock.id ? { ...s, availableStock: qty } : s));
    }
    setEditingStockId(null);
  };

  const handleUpdateTransferStatus = async (transferId: number, nextStatus: 'IN_TRANSIT' | 'RECEIVED' | 'REJECTED') => {
    try {
      await axios.put(`http://localhost:8080/api/inventory/transfers/${transferId}/status`, { status: nextStatus });
      loadManagerData();
    } catch (err) {
      console.warn("Backend offline. Simulating local transfer status update.");
      const storedTrans = localStorage.getItem('fulfilliq_transfers');
      if (storedTrans) {
        const transList = JSON.parse(storedTrans);
        const targetTransfer = transList.find((t: any) => t.id === transferId);
        
        if (targetTransfer) {
          if (nextStatus === 'IN_TRANSIT') {
            const storedInv = localStorage.getItem('fulfilliq_inventory');
            if (storedInv) {
              const invList = JSON.parse(storedInv);
              let hasStock = true;
              
              targetTransfer.items.forEach((item: any) => {
                const whStock = invList.find((i: any) => i.warehouseId === targetTransfer.fromWarehouseId && i.productId === item.productId);
                if (!whStock || whStock.availableStock < item.quantity) {
                  hasStock = false;
                }
              });
              
              if (!hasStock) {
                alert("Insufficient stock at source warehouse to ship this transfer!");
                return;
              }
              
              const updatedInvList = invList.map((i: any) => {
                const matchItem = targetTransfer.items.find((item: any) => item.productId === i.productId);
                if (i.warehouseId === targetTransfer.fromWarehouseId && matchItem) {
                  return { ...i, availableStock: i.availableStock - matchItem.quantity };
                }
                return i;
              });
              localStorage.setItem('fulfilliq_inventory', JSON.stringify(updatedInvList));
            }
          }
          else if (nextStatus === 'RECEIVED') {
            const storedInv = localStorage.getItem('fulfilliq_inventory');
            if (storedInv) {
              const invList = JSON.parse(storedInv);
              const updatedInvList = [...invList];
              
              targetTransfer.items.forEach((item: any) => {
                const whStockIdx = updatedInvList.findIndex((i: any) => i.warehouseId === targetTransfer.toWarehouseId && i.productId === item.productId);
                if (whStockIdx !== -1) {
                  updatedInvList[whStockIdx] = {
                    ...updatedInvList[whStockIdx],
                    availableStock: updatedInvList[whStockIdx].availableStock + item.quantity
                  };
                } else {
                  updatedInvList.push({
                    id: updatedInvList.length + 1,
                    warehouseId: targetTransfer.toWarehouseId,
                    productId: item.productId,
                    availableStock: item.quantity,
                    reservedStock: 0
                  });
                }
              });
              
              localStorage.setItem('fulfilliq_inventory', JSON.stringify(updatedInvList));
            }
          }
          
          const updatedTrans = transList.map((t: any) => {
            if (t.id === transferId) {
              return { ...t, status: nextStatus, updatedAt: new Date().toISOString() };
            }
            return t;
          });
          
          localStorage.setItem('fulfilliq_transfers', JSON.stringify(updatedTrans));
          loadManagerData();
        }
      }
    }
  };

  return (
    <Container sx={{ py: 6 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 4 }}>
        <Box>
          <Typography variant="h3" fontWeight="bold" sx={{ fontFamily: 'Outfit' }}>
            Warehouse Portal
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Assigned Facility: <strong>{warehouseName}</strong> (ID: {warehouseId})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <TextField
            select
            label="Facility Selector (Mock)"
            size="small"
            value={warehouseId}
            onChange={(e) => setWarehouseId(Number(e.target.value))}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value={1}>Delhi Hub (ID: 1)</MenuItem>
            <MenuItem value={2}>Mumbai Terminal (ID: 2)</MenuItem>
            <MenuItem value={3}>Bangalore Terminal (ID: 3)</MenuItem>
            <MenuItem value={4}>Hyderabad Hub (ID: 4)</MenuItem>
            <MenuItem value={5}>Kolkata Terminal (ID: 5)</MenuItem>
          </TextField>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} textColor="inherit" indicatorColor="primary">
          <Tab label="Picking List & Shipments" />
          <Tab label="Inventory Stock Levels" />
          <Tab label="Facility Insights" />
          <Tab label="Stock Transfers" />
        </Tabs>
      </Box>

      {/* TAB 0: SHIPMENTS */}
      {activeTab === 0 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Pending Dispatches</Typography>
          <TableContainer component={Paper} className="glass-panel" sx={{ background: 'rgba(17, 24, 39, 0.5)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tracking Number</TableCell>
                  <TableCell>Order ID</TableCell>
                  <TableCell>Courier</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Last Updated</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {shipments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell style={{ fontWeight: 'bold' }}>{s.trackingNumber}</TableCell>
                    <TableCell>#{s.orderId}</TableCell>
                    <TableCell>{s.courier}</TableCell>
                    <TableCell>
                      <Chip
                        label={s.status}
                        color={s.status === 'DELIVERED' ? 'success' : s.status === 'SHIPPED' ? 'info' : 'warning'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{new Date(s.updatedAt).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      {s.status === 'PACKED' && (
                        <Button
                          variant="contained"
                          size="small"
                          color="info"
                          onClick={() => handleUpdateStatus(s.id, 'SHIPPED')}
                          sx={{ textTransform: 'none' }}
                        >
                          Mark as Shipped
                        </Button>
                      )}
                      {s.status === 'SHIPPED' && (
                        <Button
                          variant="contained"
                          size="small"
                          color="success"
                          onClick={() => handleUpdateStatus(s.id, 'DELIVERED')}
                          sx={{ textTransform: 'none' }}
                        >
                          Mark as Delivered
                        </Button>
                      )}
                      {s.status === 'DELIVERED' && (
                        <Typography variant="caption" color="text.secondary">Fulfillment Complete</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 1: STOCK LEVELS */}
      {activeTab === 1 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Inventory Records</Typography>
          <TableContainer component={Paper} className="glass-panel" sx={{ background: 'rgba(17, 24, 39, 0.5)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product SKU</TableCell>
                  <TableCell>Product Name</TableCell>
                  <TableCell align="right">Available Stock</TableCell>
                  <TableCell align="right">Reserved Stock</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stocks.map((stock) => {
                  const prod = products[stock.productId];
                  const isEditing = editingStockId === stock.id;

                  return (
                    <TableRow key={stock.id}>
                      <TableCell>{prod?.sku || 'SKU-UNKNOWN'}</TableCell>
                      <TableCell style={{ fontWeight: 'bold' }}>{prod?.name || 'PRODUCT-UNKNOWN'}</TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <TextField
                            type="number"
                            size="small"
                            value={editingQty}
                            onChange={(e) => setEditingQty(e.target.value)}
                            sx={{ width: 80 }}
                            inputProps={{ style: { textAlign: 'right' } }}
                          />
                        ) : (
                          <Typography fontWeight="bold" color={stock.availableStock < 5 ? 'error' : 'inherit'}>
                            {stock.availableStock}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right" style={{ color: '#9ca3af' }}>{stock.reservedStock}</TableCell>
                      <TableCell align="center">
                        {isEditing ? (
                          <IconButton color="primary" onClick={() => handleSaveStock(stock)}>
                            <SaveIcon />
                          </IconButton>
                        ) : (
                          <IconButton color="inherit" onClick={() => handleEditStock(stock)}>
                            <EditIcon />
                          </IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: INSIGHTS */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card className="glass-panel" sx={{ background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
              <CardContent>
                <Typography variant="h6" color="error" fontWeight="bold" gutterBottom>
                  Low Stock Items ({warehouseName})
                </Typography>
                <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
                  Restock immediately to prevent split order routing failures for nearby orders.
                </Typography>

                {stocks.filter(s => s.availableStock < 5).map(stock => {
                  const prod = products[stock.productId];
                  return (
                    <Box key={stock.id} sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', py: 1 }}>
                      <Typography variant="body2">{prod?.name || 'Unknown Product'}</Typography>
                      <Typography variant="body2" color="error" fontWeight="bold">{stock.availableStock} remaining</Typography>
                    </Box>
                  );
                })}
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card className="glass-panel" sx={{ background: 'rgba(16, 185, 129, 0.05)', borderColor: 'rgba(16, 185, 129, 0.2)' }}>
              <CardContent>
                <Typography variant="h6" color="success.main" fontWeight="bold" gutterBottom>
                  Fulfillment Stats
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Sourced Dispatches</Typography>
                    <Typography variant="h4" fontWeight="bold">{shipments.length}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Completed Deliveries</Typography>
                    <Typography variant="h4" fontWeight="bold" color="success.main">
                      {shipments.filter(s => s.status === 'DELIVERED').length}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 3: STOCK TRANSFERS */}
      {activeTab === 3 && (
        <Box>
          <Typography variant="h6" fontWeight="bold" gutterBottom>Facility Stock Transfer Rebalancing</Typography>
          <TableContainer component={Paper} className="glass-panel" sx={{ background: 'rgba(17, 24, 39, 0.5)' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Direction</TableCell>
                  <TableCell>Items</TableCell>
                  <TableCell>Date Created</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transfers.map((t) => {
                  const isSource = t.fromWarehouseId === warehouseId;
                  const directionLabel = isSource ? `OUTGOING to Warehouse ID: ${t.toWarehouseId}` : `INCOMING from Warehouse ID: ${t.fromWarehouseId}`;
                  const directionColor = isSource ? '#f87171' : '#34d399';
                  
                  return (
                    <TableRow key={t.id}>
                      <TableCell>#{t.id}</TableCell>
                      <TableCell style={{ fontWeight: 'bold', color: directionColor }}>
                        {directionLabel}
                      </TableCell>
                      <TableCell>
                        {t.items.map((item: any, index: number) => {
                          const prodName = products[item.productId]?.name || `Product ID ${item.productId}`;
                          return <div key={index}>{prodName} (x{item.quantity})</div>;
                        })}
                      </TableCell>
                      <TableCell>{new Date(t.createdAt).toLocaleString('en-IN')}</TableCell>
                      <TableCell>
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
                      <TableCell align="center">
                        {isSource && t.status === 'PENDING' && (
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button
                              variant="contained"
                              size="small"
                              color="success"
                              onClick={() => handleUpdateTransferStatus(t.id, 'IN_TRANSIT')}
                              sx={{ textTransform: 'none', fontWeight: 'bold' }}
                            >
                              Approve & Ship
                            </Button>
                            <Button
                              variant="outlined"
                              size="small"
                              color="error"
                              onClick={() => handleUpdateTransferStatus(t.id, 'REJECTED')}
                              sx={{ textTransform: 'none', fontWeight: 'bold' }}
                            >
                              Reject
                            </Button>
                          </Box>
                        )}
                        {!isSource && t.status === 'IN_TRANSIT' && (
                          <Button
                            variant="contained"
                            size="small"
                            color="success"
                            onClick={() => handleUpdateTransferStatus(t.id, 'RECEIVED')}
                            sx={{ textTransform: 'none', fontWeight: 'bold' }}
                          >
                            Confirm Receipt
                          </Button>
                        )}
                        {((isSource && t.status !== 'PENDING') || (!isSource && t.status !== 'IN_TRANSIT')) && (
                          <Typography variant="caption" color="text.secondary">No Actions Required</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {transfers.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ color: 'text.secondary', py: 4 }}>
                      No transfers registered for this facility.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
    </Container>
  );
};

export default ManagerPortal;
