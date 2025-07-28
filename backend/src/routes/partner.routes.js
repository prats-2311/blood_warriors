const express = require('express');
const { 
  createSosRequest, 
  registerDonor
} = require('../controllers/partner.controller');
const { authenticatePartner } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require partner authentication
router.use(authenticatePartner);

// Create an SOS request (for hospitals)
router.post('/requests/sos', createSosRequest);

// Register a donor (for NGOs)
router.post('/donors/register', registerDonor);

module.exports = router;