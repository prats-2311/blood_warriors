const express = require('express');
const { queryCareBot } = require('../controllers/ai.controller');
const AuthMiddleware = require('../middleware/AuthMiddleware');

const router = express.Router();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.authenticate);

// Query the CareBot
router.post('/carebot/query', queryCareBot);

module.exports = router;