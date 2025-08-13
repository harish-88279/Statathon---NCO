import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Card, Alert, Form, Button } from 'react-bootstrap';
import { API_URL } from '../config';

const Admin = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
              const response = await axios.post(`${API_URL}/admin/login`, {
        username,
        password
      });
      
      if (response.data.message === 'Login successful') {
        // Store authentication state with timestamp
        const loginTime = new Date().getTime();
        localStorage.setItem('isAdminAuthenticated', 'true');
        localStorage.setItem('adminLoginTime', loginTime.toString());
        navigate('/admin/dashboard');
      }
    } catch (error) {
      setError('Invalid credentials');
    }
  };



  return (
    <Container className="py-5 d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <Card className="shadow-sm" style={{ maxWidth: '400px', width: '100%' }}>
        <Card.Header className="bg-dark text-white">
          <h4 className="text-center mb-0">Admin Login</h4>
        </Card.Header>
        <Card.Body className="bg-light">
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Username</Form.Label>
              <Form.Control
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-white"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-white"
              />
            </Form.Group>
            <Button type="submit" variant="dark" className="w-100">
              Login
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Admin;