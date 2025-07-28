const express = require('express');
const { 
  createRequest, 
  getRequest, 
  listRequests, 
  respondToRequest,
  updateRequestStatus
} = require('../controllers/requests.controller');
const { authenticate, isPatient, isDonor } = require('../middleware/auth.middleware');

const router = express.Router();

// Create a new donation request (patients only)
router.post('/', authenticate, isPatient, createRequest);

// Get a specific donation request (all authenticated users)
router.get('/:id', authenticate, getRequest);

// List donation requests (all authenticated users)
router.get('/', authenticate, listRequests);

// Respond to a donation request (donors only)
router.post('/:id/respond', authenticate, isDonor, respondToRequest);

// Update donation request status (patients only)
router.put('/:id/status', authenticate, isPatient, updateRequestStatus);

module.exports = router;