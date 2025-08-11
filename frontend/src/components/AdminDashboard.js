import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Table, InputGroup } from 'react-bootstrap';
import axios from 'axios';

const AdminDashboard = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('title'); // 'title' or 'code'
  const [searchResults, setSearchResults] = useState([]);
  const [message, setMessage] = useState(null);
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
    } catch (error) {
      setMessage({ type: 'danger', text: 'Failed to search occupations' });
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

  return (
    <Container className="py-4">
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-dark text-white">
          <h4 className="text-center mb-0">Admin Dashboard</h4>
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
                  placeholder="Search occupations..."
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
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((result) => (
                        result.Occupations.map((occupation, index) => (
                          <tr key={`${result._id}-${index}`}>
                            <td>{occupation.NCO_2004_Code}</td>
                            <td>{occupation.Code}</td>
                            <td>{occupation.Title}</td>
                            <td>{result.Division_Title}</td>
                            <td>{result.Sub_Division_Title}</td>
                            <td>{result.Group_Title}</td>
                            <td>{result.Family_Title}</td>
                            <td>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDelete(result._id)}
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
              )}
            </Card.Body>
          </Card>

          <Card>
            <Card.Header className="bg-secondary text-white">
              <h5 className="mb-0">Add New Occupation</h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Division Title</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.Division_Title}
                        onChange={(e) => setFormData({...formData, Division_Title: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Sub Division Title</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.Sub_Division_Title}
                        onChange={(e) => setFormData({...formData, Sub_Division_Title: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Group Title</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.Group_Title}
                        onChange={(e) => setFormData({...formData, Group_Title: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-6">
                    <Form.Group className="mb-3">
                      <Form.Label>Family Title</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.Family_Title}
                        onChange={(e) => setFormData({...formData, Family_Title: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>NCO 2004 Code</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.NCO_2004_Code}
                        onChange={(e) => setFormData({...formData, NCO_2004_Code: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Code 2015</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.Code}
                        onChange={(e) => setFormData({...formData, Code: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </div>
                  <div className="col-md-4">
                    <Form.Group className="mb-3">
                      <Form.Label>Job Title</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.Title}
                        onChange={(e) => setFormData({...formData, Title: e.target.value})}
                        required
                      />
                    </Form.Group>
                  </div>
                </div>

                <Button type="submit" variant="dark" className="w-100">
                  Add Occupation
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminDashboard;