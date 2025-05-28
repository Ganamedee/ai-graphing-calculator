const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Only keep the generate endpoint
router.post('/generate', aiController.generateEquations);

module.exports = router;