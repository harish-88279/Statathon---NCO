import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Table, InputGroup, Modal } from 'react-bootstrap';
import axios from 'axios';
import OccupationFormFields from './OccupationFormFields';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('title');
  const [searchResults, setSearchResults] = useState([]);
  const [message, setMessage] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOccupation, setEditingOccupation] = useState(null);
  const [formData, setFormData] = useState({
    Division_Title: '',
    Sub_Division_Title: '',
    Group_Title: '',
    Family_Title: '',
    Code: '',
    Title: '',
    NCO_2004_Code: ''
  });

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/occupations/search?term=${searchTerm}&type=${searchType}`);
      setSearchResults(response.data);
      if (response.data.length === 0) {
        setMessage({ type: 'info', text: 'No exact matches found' });
      }
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to search occupations' });
    }
  };

  const handleEdit = (occupation) => {
    setEditingOccupation(occupation);
    setFormData({
      Division_Title: occupation.Division_Title,
      Sub_Division_Title: occupation.Sub_Division_Title,
      Group_Title: occupation.Group_Title,
      Family_Title: occupation.Family_Title,
      Code: occupation.Occupations[0].Code,
      Title: occupation.Occupations[0].Title,
      NCO_2004_Code: occupation.Occupations[0].NCO_2004_Code
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    try {
      const updatedData = {
        ...formData,
        Occupations: [{
          Code: formData.Code,
          Title: formData.Title,
          NCO_2004_Code: formData.NCO_2004_Code
        }]
      };
      await axios.put(`http://localhost:5000/api/occupations/${editingOccupation._id}`, updatedData);
      setMessage({ type: 'success', text: 'Occupation updated successfully' });
      setShowEditModal(false);
      handleSearch(); // Refresh search results
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to update occupation' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/occupations', formData);
      setMessage({ type: 'success', text: 'Occupation added successfully' });
      setFormData({
        Division_Title: '',
        Sub_Division_Title: '',
        Group_Title: '',
        Family_Title: '',
        Code: '',
        Title: '',
        NCO_2004_Code: ''
      });
      handleSearch(); // Refresh search results
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to add occupation' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/occupations/${id}`);
      setMessage({ type: 'success', text: 'Occupation deleted successfully' });
      handleSearch(); // Refresh search results
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to delete occupation' });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdminAuthenticated');
    localStorage.removeItem('adminLoginTime');
    navigate('/admin');
  };

  return (
    <Container className="py-4">
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-dark text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h4 className="mb-0">Admin Dashboard</h4>
            <Button variant="outline-light" size="sm" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-1"></i>
              Logout
            </Button>
          </div>
        </Card.Header>
        <Card.Body className="bg-light">
          {message && (
            <Alert variant={message.type} dismissible onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          <Card className="mb-4">
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">Search Occupations</h5>
            </Card.Header>
            <Card.Body>
              <InputGroup className="mb-3">
                <Form.Control
                  placeholder="Enter exact title or code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Form.Select
                  value={searchType}
                  onChange={(e) => setSearchType(e.target.value)}
                  style={{ maxWidth: '150px' }}
                >
                  <option value="title">By Title</option>
                  <option value="code">By Code</option>
                </Form.Select>
                <Button variant="dark" onClick={handleSearch}>
                  Search
                </Button>
              </InputGroup>

              {searchResults.length > 0 && (
                <div className="table-responsive">
                  <Table striped bordered hover size="sm">
                    <thead>
                      <tr>
                        <th>NCO 2004 Code</th>
                        <th>Code 2015</th>
                        <th>Job Title</th>
                        <th>Division</th>
                        <th>Sub Division</th>
                        <th>Group</th>
                        <th>Family</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((result) => (
                        <tr key={result._id}>
                          <td>{result.Occupations[0].NCO_2004_Code}</td>
                          <td>{result.Occupations[0].Code}</td>
                          <td>{result.Occupations[0].Title}</td>
                          <td>{result.Division_Title}</td>
                          <td>{result.Sub_Division_Title}</td>
                          <td>{result.Group_Title}</td>
                          <td>{result.Family_Title}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleEdit(result)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(result._id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">Add New Occupation</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <OccupationFormFields formData={formData} setFormData={setFormData} />
                <Button type="submit" variant="dark" className="w-100">
                  Add Occupation
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>

      {/* Edit Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton className="bg-dark text-white">
          <Modal.Title>Edit Occupation</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <OccupationFormFields formData={formData} setFormData={setFormData} />
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Cancel
          </Button>
          <Button variant="dark" onClick={handleUpdate}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;