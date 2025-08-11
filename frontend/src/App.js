import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Card, Alert } from 'react-bootstrap';
import './App.css';
import Admin from './components/Admin';
import AdminDashboard from './components/AdminDashboard';

const TreeNode = ({ label, children, isExpanded, onToggle }) => {
  return (
    <div className="tree-node">
      <div className="tree-content" onClick={onToggle}>
        {children && (
          <svg
            className={`chevron ${isExpanded ? 'expanded' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              d="M9 18l6-6-6-6"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        <span className="tree-node-content">{label}</span>
      </div>
      {children && (
        <div className={`tree-children ${isExpanded ? 'expanded' : ''}`}>
          {children}
        </div>
      )}
    </div>
  );
};

function App() {
  const [hierarchyData, setHierarchyData] = useState({});
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [importStatus, setImportStatus] = useState(null);

  const API_URL = 'http://localhost:5000/api';

  // Import data on first load
  useEffect(() => {
    const importData = async () => {
      try {
        setLoading(true);
        const response = await axios.post(`${API_URL}/import-data`);
        setImportStatus({ type: 'success', message: response.data.message });
      } catch (error) {
        if (error.response && error.response.status === 400) {
          setImportStatus({ type: 'info', message: 'Using existing database data' });
        } else {
          setImportStatus({ type: 'danger', message: 'Failed to import data' });
          console.error('Error importing data:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    importData();
  }, []);

  // Load all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const occupationsResponse = await axios.get(`${API_URL}/occupations`);
        const data = occupationsResponse.data;

        // Organize data into hierarchy
        const hierarchy = {};
        data.forEach(item => {
          if (!hierarchy[item.Division_Title]) {
            hierarchy[item.Division_Title] = {};
          }
          if (!hierarchy[item.Division_Title][item.Sub_Division_Title]) {
            hierarchy[item.Division_Title][item.Sub_Division_Title] = {};
          }
          if (!hierarchy[item.Division_Title][item.Sub_Division_Title][item.Group_Title]) {
            hierarchy[item.Division_Title][item.Sub_Division_Title][item.Group_Title] = {};
          }
          if (!hierarchy[item.Division_Title][item.Sub_Division_Title][item.Group_Title][item.Family_Title]) {
            hierarchy[item.Division_Title][item.Sub_Division_Title][item.Group_Title][item.Family_Title] = 
              item.Occupations;
          }
        });

        setHierarchyData(hierarchy);
      } catch (error) {
        setError('Failed to fetch data');
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, []);

  const toggleNode = (nodePath) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodePath)) {
        next.delete(nodePath);
      } else {
        next.add(nodePath);
      }
      return next;
    });
  };

  const renderTree = (data, path = '') => {
    if (Array.isArray(data)) {
      return (
        <div className="table-responsive mt-2">
          <table className="table table-striped table-bordered">
            <thead className="thead-dark">
              <tr>
                <th>Code</th>
                <th>Title</th>
                <th>NCO 2004 Code</th>
              </tr>
            </thead>
            <tbody>
              {data.map((occupation, index) => (
                <tr key={index}>
                  <td>{occupation.Code}</td>
                  <td>{occupation.Title}</td>
                  <td>{occupation.NCO_2004_Code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return Object.entries(data).map(([key, value]) => {
      const currentPath = path ? `${path}-${key}` : key;
      const isExpanded = expandedNodes.has(currentPath);

      return (
        <TreeNode
          key={currentPath}
          label={key}
          isExpanded={isExpanded}
          onToggle={() => toggleNode(currentPath)}
        >
          {isExpanded && renderTree(value, currentPath)}
        </TreeNode>
      );
    });
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Container className="py-5">
            <Card className="shadow-sm mb-5">
              <Card.Header className="bg-primary text-white">
                <h1 className="text-center">Government Occupational Database</h1>
              </Card.Header>
              <Card.Body>
                {importStatus && (
                  <Alert variant={importStatus.type} dismissible>
                    {importStatus.message}
                  </Alert>
                )}
                
                {error && (
                  <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                  </Alert>
                )}

                {loading ? (
                  <div className="text-center">Loading...</div>
                ) : (
                  <div className="tree-view">
                    {renderTree(hierarchyData)}
                  </div>
                )}
              </Card.Body>
              <Card.Footer className="text-center text-muted">
                Government Occupational Database © {new Date().getFullYear()}
              </Card.Footer>
            </Card>
          </Container>
        } />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
