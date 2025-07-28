const express = require('express');
const { queryCareBot } = require('../controllers/ai.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Query the CareBot
router.post('/carebot/query', queryCareBot);

module.exports = router;