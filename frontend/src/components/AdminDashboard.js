import React from 'react';
import { Container, Card } from 'react-bootstrap';

const AdminDashboard = () => {
  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Header className="bg-primary text-white">
          <h2 className="text-center">Admin Dashboard</h2>
        </Card.Header>
        <Card.Body>
          <h3>Welcome to Admin Dashboard</h3>
          {/* Add admin features here */}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminDashboard;