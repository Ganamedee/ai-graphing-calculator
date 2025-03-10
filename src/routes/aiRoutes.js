const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Get list of available models
router.get('/models', aiController.getModels);

// Generate equations from text description
router.post('/generate', aiController.generateEquations);

module.exports = router;