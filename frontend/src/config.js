// Configuration for backend API URL
const getBackendUrl = () => {
  // Check if we're in production (Vercel deployment)
  if (process.env.NODE_ENV === 'production') {
    // Use environment variable if set, otherwise use a default Render URL
    return process.env.REACT_APP_BACKEND_URL || 'https://statathon-nco.onrender.com';
  }
  // Development environment - use localhost
  return 'http://localhost:5000';
};

export const API_BASE_URL = getBackendUrl();
export const API_URL = `${API_BASE_URL}/api`;

// Log the API URL for debugging (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Backend API URL:', API_URL);
}
