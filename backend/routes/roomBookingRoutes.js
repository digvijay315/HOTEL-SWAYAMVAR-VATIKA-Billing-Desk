const express = require('express');
const router = express.Router();
const { getAllBookings, checkIn, checkOut } = require('../controllers/roomBookingController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getAllBookings);

router.route('/checkin')
  .post(protect, checkIn);

router.route('/checkout/:id')
  .post(protect, checkOut);

module.exports = router;
