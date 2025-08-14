const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://hjharish2005:Harish%4088279@cluster-statathon.xkyvz84.mongodb.net/?retryWrites=true&w=majority&appName=Cluster-Statathon";

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Schema
const OccupationSchema = new mongoose.Schema({
  Division: String,
  Division_Title: String,
  Sub_Division: String,
  Sub_Division_Title: String,
  Group: String,
  Group_Title: String,
  Family: String,
  Family_Title: String,
  Description: String,
  Occupations: [{
    Code: String,
    Title: String,
    NCO_2004_Code: String
  }]
});

const Occupation = mongoose.model('Occupation', OccupationSchema);

// Routes
app.get('/api/occupations', async (req, res) => {
  try {
    const occupations = await Occupation.find({});
    res.json(occupations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/divisions', async (req, res) => {
  try {
    const divisions = await Occupation.distinct('Division_Title');
    res.json(divisions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/subdivisions/:division', async (req, res) => {
  try {
    const subdivisions = await Occupation.distinct('Sub_Division_Title', { Division_Title: req.params.division });
    res.json(subdivisions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/groups/:subdivision', async (req, res) => {
  try {
    const groups = await Occupation.distinct('Group_Title', { Sub_Division_Title: req.params.subdivision });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/families/:group', async (req, res) => {
  try {
    const families = await Occupation.distinct('Family_Title', { Group_Title: req.params.group });
    res.json(families);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Import data from JSON file (one-time operation)
app.post('/api/import-data', async (req, res) => {
  try {
    // Check if data already exists
    const count = await Occupation.countDocuments();
    if (count > 0) {
      return res.status(400).json({ message: 'Data already imported' });
    }

    const dataPath = path.join(__dirname, '..', 'dataset.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    await Occupation.insertMany(data);
    res.status(201).json({ message: 'Data imported successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Schema
const AdminSchema = new mongoose.Schema({
  username: String,
  password: String
});

const Admin = mongoose.model('Admin', AdminSchema);

// Admin Routes
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username, password });
    
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    res.json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create admin user (one-time setup)
app.post('/api/admin/setup', async (req, res) => {
  try {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({});
    if (existingAdmin) {
      return res.status(400).json({ message: 'Admin user already exists' });
    }
    
    // Create default admin user
    const admin = new Admin({
      username: 'admin',
      password: 'admin123'
    });
    
    await admin.save();
    res.status(201).json({ message: 'Admin user created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Logout endpoint
app.post('/api/admin/logout', async (req, res) => {
  try {
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new occupation
app.post('/api/occupations', async (req, res) => {
  try {
    const newOccupation = new Occupation({
      Division_Title: req.body.Division_Title,
      Sub_Division_Title: req.body.Sub_Division_Title,
      Group_Title: req.body.Group_Title,
      Family_Title: req.body.Family_Title,
      Occupations: [{
        Code: req.body.Code,
        Title: req.body.Title,
        NCO_2004_Code: req.body.NCO_2004_Code
      }]
    });

    await newOccupation.save();
    res.status(201).json({ message: 'Occupation added successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete occupation
app.delete('/api/occupations/:id', async (req, res) => {
  try {
    await Occupation.findByIdAndDelete(req.params.id);
    res.json({ message: 'Occupation deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search occupations
app.get('/api/occupations/search', async (req, res) => {
  try {
    const { term, type } = req.query;
    let matchStage = {};

    if (type === 'code') {
      matchStage = { 'Occupations.Code': { $regex: new RegExp('^' + term + '$', 'i') } };
    } else {
      matchStage = { 'Occupations.Title': { $regex: new RegExp('^' + term + '$', 'i') } };
    }

    // Use aggregation pipeline to remove duplicates more efficiently
    const results = await Occupation.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            code: '$Occupations.Code',
            title: '$Occupations.Title'
          },
          doc: { $first: '$$ROOT' }
        }
      },
      { $replaceRoot: { newRoot: '$doc' } },
      { $sort: { 'Occupations.Code': 1 } }
    ]);
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update occupation
app.put('/api/occupations/:id', async (req, res) => {
  try {
    const updatedOccupation = await Occupation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedOccupation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ---------- RAG search route (cross-platform Python spawn) ----------
app.post('/api/rag-search', async (req, res) => {
  const { query } = req.body || {};
  const scriptPath = path.resolve(__dirname, 'rag_search.py');
  // Prefer an env var; otherwise choose python3 on Linux/macOS and python on Windows
  const pythonCmd = process.env.PYTHON_CMD || (process.platform === 'win32' ? 'python' : 'python3');
  const timeoutMs = Number(process.env.PYTHON_TIMEOUT_MS || 120000); // 2 min default

  console.log(`Executing: ${pythonCmd} ${scriptPath} "${query}"`);
  // Optional diagnostics to help on Render
  try {
    const whichOut = execSync(`${process.platform === 'win32' ? 'where' : 'which'} ${pythonCmd} || true`).toString();
    console.log(`Resolved ${pythonCmd}: ${whichOut.trim()}`);
  } catch (_) {
    console.log(`Could not resolve ${pythonCmd} via which/where`);
  }

  if (!fs.existsSync(scriptPath)) {
    return res.status(500).json({
      error: 'rag_search.py not found on server',
      scriptPath
    });
  }

  let stdout = '';
  let stderr = '';
  let responded = false;

  const safeSend = (status, body) => {
    if (!responded) {
      responded = true;
      clearTimeout(killer);
      return res.status(status).json(body);
    }
  };

  const child = spawn(pythonCmd, [scriptPath, query ?? ''], {
    cwd: __dirname,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  child.on('error', (err) => {
    console.error('Spawn error:', err);
    safeSend(500, {
      error: 'Failed to start Python process',
      details: err.message,
      hint: 'On Render, ensure python3 is installed and PYTHON_CMD=python3 is set'
    });
  });

  child.stdout.on('data', (d) => {
    const text = d.toString();
    stdout += text;
    console.log(`Python stdout: ${text}`);
  });

  child.stderr.on('data', (d) => {
    const text = d.toString();
    stderr += text;
    console.error(`Python stderr: ${text}`);
  });

  const killer = setTimeout(() => {
    console.error(`Python process exceeded ${timeoutMs}ms, killing...`);
    child.kill('SIGKILL');
  }, timeoutMs);

  child.on('close', (code) => {
    console.log(`Python process exited with code ${code}`);
    if (code !== 0) {
      return safeSend(500, {
        error: 'RAG search failed',
        code,
        details: stderr || 'No error output from Python'
      });
    }
    // Try parse JSON; if not JSON, return raw string
    try {
      const parsed = JSON.parse(stdout);
      return safeSend(200, { result: parsed });
    } catch {
      return safeSend(200, { result: stdout.trim() });
    }
  });
});
// ---------- end RAG route ----------

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
