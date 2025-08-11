import React, { useState, useEffect } from 'react';
import { Container, Card, Form, Button, Alert, Table } from 'react-bootstrap';
import axios from 'axios';

const AdminDashboard = () => {
  const [divisions, setDivisions] = useState([]);
  const [formData, setFormData] = useState({
    Division_Title: '',
    Sub_Division_Title: '',
    Group_Title: '',
    Family_Title: '',
    Code: '',
    Title: '',
    NCO_2004_Code: ''
  });
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchDivisions();
  }, []);

  const fetchDivisions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/occupations');
      setDivisions(response.data);
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to fetch divisions' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/occupations', formData);
      setMessage({ type: 'success', text: 'Occupation added successfully' });
      fetchDivisions();
      setFormData({
        Division_Title: '',
        Sub_Division_Title: '',
        Group_Title: '',
        Family_Title: '',
        Code: '',
        Title: '',
        NCO_2004_Code: ''
      });
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to add occupation' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/occupations/${id}`);
      setMessage({ type: 'success', text: 'Occupation deleted successfully' });
      fetchDivisions();
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to delete occupation' });
    }
  };

  return (
    <Container className="py-4">
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-dark text-white">
          <h2 className="text-center mb-0">Admin Dashboard</h2>
        </Card.Header>
        <Card.Body>
          {message && (
            <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          <h4 className="mb-3">Add New Occupation</h4>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Division Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.Division_Title}
                onChange={(e) => setFormData({...formData, Division_Title: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Sub Division Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.Sub_Division_Title}
                onChange={(e) => setFormData({...formData, Sub_Division_Title: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Group Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.Group_Title}
                onChange={(e) => setFormData({...formData, Group_Title: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Family Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.Family_Title}
                onChange={(e) => setFormData({...formData, Family_Title: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Code</Form.Label>
              <Form.Control
                type="text"
                value={formData.Code}
                onChange={(e) => setFormData({...formData, Code: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                value={formData.Title}
                onChange={(e) => setFormData({...formData, Title: e.target.value})}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>NCO 2004 Code</Form.Label>
              <Form.Control
                type="text"
                value={formData.NCO_2004_Code}
                onChange={(e) => setFormData({...formData, NCO_2004_Code: e.target.value})}
                required
              />
            </Form.Group>

            <Button type="submit" variant="dark" className="w-100">Add Occupation</Button>
          </Form>

          <h4 className="mt-4 mb-3">Existing Occupations</h4>
          <div className="table-responsive">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Division</th>
                  <th>Sub Division</th>
                  <th>Group</th>
                  <th>Family</th>
                  <th>Code</th>
                  <th>Title</th>
                  <th>NCO Code</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {divisions.map((division) => (
                  division.Occupations.map((occupation, index) => (
                    <tr key={`${division._id}-${index}`}>
                      <td>{division.Division_Title}</td>
                      <td>{division.Sub_Division_Title}</td>
                      <td>{division.Group_Title}</td>
                      <td>{division.Family_Title}</td>
                      <td>{occupation.Code}</td>
                      <td>{occupation.Title}</td>
                      <td>{occupation.NCO_2004_Code}</td>
                      <td>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(division._id)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminDashboard;