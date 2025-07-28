const express = require('express');
const { 
  updateLocation, 
  toggleSosAvailability,
  updateTasteKeywords,
  getDonorCoupons,
  recordDonation,
  getNotifications
} = require('../controllers/donors.controller');
const { authenticate, isDonor } = require('../middleware/auth.middleware');

const router = express.Router();

// All routes require donor authentication
router.use(authenticate, isDonor);

// Update donor's location
router.put('/me/location', updateLocation);

// Toggle SOS availability
router.put('/me/sos-availability', toggleSosAvailability);

// Update donor's interests (taste keywords)
router.put('/me/interests', updateTasteKeywords);

// Get donor's coupons
router.get('/me/coupons', getDonorCoupons);

// Record a donation
router.post('/me/donations', recordDonation);

// Get donor's notifications
router.get('/me/notifications', getNotifications);

module.exports = router;