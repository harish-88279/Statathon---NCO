import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Card, Alert, Form, InputGroup, Button } from 'react-bootstrap';
import './App.css';
import Admin from './components/Admin';
import AdminDashboard from './components/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { API_URL } from './config';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [ragResults, setRagResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('connecting');



  // Import data on first load
  useEffect(() => {
    const importData = async () => {
      try {
        setLoading(true);
        const response = await axios.post(`${API_URL}/import-data`);
        setImportStatus({ type: 'success', message: 'Database initialized successfully with occupational data' });
      } catch (error) {
        if (error.response && error.response.status === 400) {
          // Data already exists, no need to show message
          setImportStatus(null);
        } else {
          setImportStatus({ type: 'danger', message: 'Failed to initialize database. Please refresh the page.' });
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
        setConnectionStatus('connecting');
        
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
        setConnectionStatus('connected');
        
        // Show success message for data loading
        if (data.length > 0) {
          setImportStatus({ 
            type: 'success', 
            message: `Successfully loaded ${data.length} occupational records from database` 
          });
          // Auto-hide success message after 3 seconds
          setTimeout(() => setImportStatus(null), 3000);
        }
      } catch (error) {
        setError('Failed to connect to database. Please check your connection and refresh the page.');
        setConnectionStatus('disconnected');
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
                <th>NCO 2004 Code</th>
                <th>Code 2015</th>
                <th>Job Title</th>
              </tr>
            </thead>
            <tbody>
              {data.map((occupation, index) => (
                <tr key={index}>
                  <td>{occupation.NCO_2004_Code}</td>
                  <td>{occupation.Code}</td>
                  <td>{occupation.Title}</td>
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

  const filterData = (data, term) => {
    if (!term) return data;
    const searchLower = term.toLowerCase();
    
    const filtered = {};
    Object.entries(data).forEach(([division, subdivisions]) => {
      if (division.toLowerCase().includes(searchLower)) {
        filtered[division] = subdivisions;
        return;
      }
      
      const filteredSubdivisions = {};
      Object.entries(subdivisions).forEach(([subdivision, groups]) => {
        if (subdivision.toLowerCase().includes(searchLower)) {
          filteredSubdivisions[subdivision] = groups;
          return;
        }
        
        const filteredGroups = {};
        Object.entries(groups).forEach(([group, families]) => {
          if (group.toLowerCase().includes(searchLower)) {
            filteredGroups[group] = families;
            return;
          }
          
          const filteredFamilies = {};
          Object.entries(families).forEach(([family, occupations]) => {
            if (family.toLowerCase().includes(searchLower) ||
                occupations.some(occ => 
                  occ.Title.toLowerCase().includes(searchLower) ||
                  occ.Code.toLowerCase().includes(searchLower) ||
                  occ.NCO_2004_Code.toLowerCase().includes(searchLower)
                )
            ) {
              filteredFamilies[family] = occupations;
            }
          });
          
          if (Object.keys(filteredFamilies).length > 0) {
            filteredGroups[group] = filteredFamilies;
          }
        });
        
        if (Object.keys(filteredGroups).length > 0) {
          filteredSubdivisions[subdivision] = filteredGroups;
        }
      });
      
      if (Object.keys(filteredSubdivisions).length > 0) {
        filtered[division] = filteredSubdivisions;
      }
    });
    
    return filtered;
  };

  const formatMatchedContent = (matches) => {
    if (!matches) return '';
    
    // Extract the occupation data from the matches
    const lines = matches.split('\n');
    const occupationData = {};
    
    lines.forEach(line => {
      if (line.includes(':')) {
        const [key, value] = line.split(':', 2);
        const cleanKey = key.trim();
        const cleanValue = value.trim();
        occupationData[cleanKey] = cleanValue;
      }
    });
    
    // Format the hierarchical structure
    let formattedContent = '';
    
    if (occupationData.division_title) {
      formattedContent += `📁 ${occupationData.division_title} (Division: ${occupationData.division || 'N/A'})\n`;
    }
    
    if (occupationData.sub_division_title) {
      formattedContent += `  📂 ${occupationData.sub_division_title} (Sub-Division: ${occupationData.sub_division || 'N/A'})\n`;
    }
    
    if (occupationData.group_title) {
      formattedContent += `    📁 ${occupationData.group_title} (Group: ${occupationData.group || 'N/A'})\n`;
    }
    
    if (occupationData.family_title) {
      formattedContent += `      📂 ${occupationData.family_title} (Family: ${occupationData.family || 'N/A'})\n`;
    }
    
    if (occupationData.occupation_title) {
      formattedContent += `        💼 ${occupationData.occupation_title}\n`;
      formattedContent += `           NCO 2015 Code: ${occupationData.occupation_code || 'N/A'}\n`;
      formattedContent += `           NCO 2004 Code: ${occupationData.nco_2004_code || 'N/A'}\n`;
    }
    
    if (occupationData.description) {
      formattedContent += `\n📝 Description:\n${occupationData.description}\n`;
    }
    
    // If no structured data found, return original content
    if (!formattedContent) {
      return matches;
    }
    
    return formattedContent;
  };

  const handleRagSearch = async () => {
    if (!searchTerm.trim()) {
      setError('Please enter a search query');
      return;
    }
    
    if (connectionStatus !== 'connected') {
      setError('Database connection required for AI search. Please wait for connection to establish.');
      return;
    }
    
    try {
      setIsSearching(true);
      setError(null);
      setRagResults(null);
      
      const response = await axios.post(`${API_URL}/rag-search`, { query: searchTerm });
      setRagResults(response.data.result);
      
      // Show success message for search completion
      setImportStatus({ 
        type: 'success', 
        message: `AI search completed successfully for "${searchTerm}"` 
      });
      setTimeout(() => setImportStatus(null), 3000);
    } catch (error) {
      console.error('RAG search failed:', error);
      if (error.response?.status === 500) {
        setError('AI search service unavailable. Please try again later.');
      } else if (error.code === 'ECONNREFUSED') {
        setError('Cannot connect to AI search service. Please check if the backend is running.');
      } else {
        setError('AI search failed. Please try again.');
      }
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <Container fluid className="py-4">
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-dark text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h1 className="mb-0">Government Occupational Database</h1>
                  <div className="d-flex align-items-center">
                    <div className={`me-2 ${connectionStatus === 'connected' ? 'text-success' : connectionStatus === 'connecting' ? 'text-warning' : 'text-danger'}`}>
                      <i className={`fas fa-circle ${connectionStatus === 'connected' ? 'text-success' : connectionStatus === 'connecting' ? 'text-warning' : 'text-danger'}`}></i>
                    </div>
                    <small className="text-muted">
                      {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                    </small>
                  </div>
                </div>
              </Card.Header>
              <Card.Body className="bg-light">
                <InputGroup className="mb-3">
                  <Form.Control
                    placeholder="Search occupations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleRagSearch()}
                  />
                  <Button 
                    variant="primary" 
                    onClick={handleRagSearch}
                    disabled={isSearching}
                  >
                    {isSearching ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Searching...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-robot me-2"></i>
                        AI Search
                      </>
                    )}
                  </Button>
                </InputGroup>
                {ragResults && (
                  <div className="mt-4">
                    <Card className="shadow-sm bg-dark text-white border-secondary">
                      <Card.Header className="bg-dark text-white border-secondary">
                        <h4 className="mb-0">
                          <i className="fas fa-robot me-2"></i>
                          AI Search Results
                        </h4>
                      </Card.Header>
                      <Card.Body className="bg-dark">
                        <div className="mb-4">
                          <h5 className="text-info mb-2">
                            <i className="fas fa-comment me-2"></i>
                            AI Response
                          </h5>
                          <div className="bg-secondary p-3 rounded border border-secondary">
                            <p className="mb-0 text-white">{ragResults.llm_answer}</p>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-warning mb-2">
                            <i className="fas fa-search me-2"></i>
                            Matched Content
                          </h5>
                          <div className="bg-secondary p-3 rounded border border-secondary">
                            <div style={{ whiteSpace: 'pre-wrap', fontSize: '0.9rem' }}>
                              {formatMatchedContent(ragResults.matches)}
                            </div>
                          </div>
                        </div>
                      </Card.Body>
                      <Card.Footer className="bg-dark border-secondary">
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            Results based on AI-powered semantic search
                          </small>
                          <Button 
                            variant="outline-light" 
                            size="sm"
                            onClick={() => {
                              setRagResults(null);
                              setSearchTerm('');
                            }}
                          >
                            <i className="fas fa-times me-1"></i>
                            Clear Results
                          </Button>
                        </div>
                      </Card.Footer>
                    </Card>
                  </div>
                )}
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
                    {renderTree(filterData(hierarchyData, searchTerm))}
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
        <Route path="/admin/dashboard" element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
