// src/index.js
require("dotenv").config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const aiController = require('./controllers/aiController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Debug routes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// API routes - matching exactly what the frontend expects
app.post("/api/chat", aiController.generateEquations);
app.get("/api/models", aiController.getModels);

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Open http://localhost:${PORT} in your browser`);
});