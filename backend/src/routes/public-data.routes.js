const express = require('express');
const { 
  listBloodBanks, 
  getBloodStock,
  getBloodGroups,
  getBloodComponents
} = require('../controllers/public-data.controller');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// List blood banks
router.get('/banks', listBloodBanks);

// Get blood stock information
router.get('/stock', getBloodStock);

// Get blood groups
router.get('/blood-groups', getBloodGroups);

// Get blood components
router.get('/blood-components', getBloodComponents);

module.exports = router;