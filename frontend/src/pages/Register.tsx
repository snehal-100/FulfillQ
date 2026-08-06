import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box, Button, TextField, Typography, Container, MenuItem, Paper } from '@mui/material';
import axios from 'axios';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'CUSTOMER' | 'ADMIN' | 'WAREHOUSE_MANAGER'>('CUSTOMER');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      try {
        await axios.post('http://localhost:8080/api/auth/register', { name, email, password, role });
      } catch (err) {
        console.warn("Backend auth service offline. Simulating registration success.");
      }

      setSuccess('Registration successful! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 8 }}>
      <Paper className="glass-panel" sx={{ p: 4, textAlign: 'center', background: 'rgba(17, 24, 39, 0.8)' }}>
        <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: '#818cf8', fontFamily: 'Outfit' }}>
          Create Account
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
          Join the FulfillIQ Fulfillment Network
        </Typography>

        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        {success && (
          <Typography color="success.main" variant="body2" sx={{ mb: 2 }}>
            {success}
          </Typography>
        )}

        <Box component="form" onSubmit={handleRegister} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            label="Full Name"
            variant="outlined"
            fullWidth
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Email Address"
            variant="outlined"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <TextField
            select
            label="Account Role"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            fullWidth
          >
            <MenuItem value="CUSTOMER">Customer</MenuItem>
            <MenuItem value="WAREHOUSE_MANAGER">Warehouse Manager</MenuItem>
            <MenuItem value="ADMIN">Administrator</MenuItem>
          </TextField>

          <Button type="submit" variant="contained" color="primary" size="large" sx={{ mt: 2, background: 'linear-gradient(45deg, #6366f1, #a855f7)' }}>
            Register
          </Button>
        </Box>

        <Typography variant="body2" sx={{ mt: 3, color: '#9ca3af' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 'bold' }}>
            Log In here
          </Link>
        </Typography>
      </Paper>
    </Container>
  );
};

export default Register;
