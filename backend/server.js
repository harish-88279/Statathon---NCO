const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
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
    let query = {};

    if (type === 'code') {
      query = { 'Occupations.Code': { $regex: term, $options: 'i' } };
    } else {
      query = { 'Occupations.Title': { $regex: term, $options: 'i' } };
    }

    const results = await Occupation.find(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});