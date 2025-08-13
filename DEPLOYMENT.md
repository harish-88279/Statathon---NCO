# Deployment Guide for Statathon

## Backend Deployment (Render)

### 1. Deploy to Render
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set the following configuration:
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && python server.js`
   - **Root Directory:** `backend`

### 2. Environment Variables
Set these environment variables in Render:
```
MONGODB_URI=your_mongodb_connection_string
GOOGLE_API_KEY=your_google_gemini_api_key
```

### 3. Get Your Render URL
After deployment, note your Render app URL (e.g., `https://your-app-name.onrender.com`)

## Frontend Deployment (Vercel)

### 1. Deploy to Vercel
1. Connect your GitHub repository to Vercel
2. Set the following configuration:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

### 2. Environment Variables
Set this environment variable in Vercel:
```
REACT_APP_BACKEND_URL=https://your-render-app-name.onrender.com
```
Replace `your-render-app-name` with your actual Render app name.

### 3. Alternative: Update Config File
If you prefer to hardcode the URL, update `frontend/src/config.js`:
```javascript
// Replace this line:
return process.env.REACT_APP_BACKEND_URL || 'https://your-render-app-name.onrender.com';

// With your actual Render URL:
return process.env.REACT_APP_BACKEND_URL || 'https://your-actual-app-name.onrender.com';
```

## Local Development

### Backend
```bash
cd backend
pip install -r requirements.txt
python server.js
```

### Frontend
```bash
cd frontend
npm install
npm start
```

The frontend will automatically use `http://localhost:5000` in development mode.

## Important Notes

1. **CORS Configuration:** The backend is already configured to accept requests from any origin in production
2. **Environment Variables:** Never commit sensitive API keys to Git
3. **Database:** Make sure your MongoDB database is accessible from Render
4. **Python Dependencies:** All required packages are listed in `backend/requirements.txt`

## Troubleshooting

### Frontend can't connect to backend
1. Check that the `REACT_APP_BACKEND_URL` environment variable is set correctly in Vercel
2. Verify your Render app is running and accessible
3. Check the browser console for CORS errors

### Backend deployment fails
1. Ensure all dependencies are in `requirements.txt`
2. Check that the start command is correct
3. Verify environment variables are set in Render
