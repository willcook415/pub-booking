const express = require('express');
const router = express.Router();
const { Booking } = require('../models');
const authenticateToken = require('../middleware/auth');

// Create a booking (POST /api/booking)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, email, date, time, partySize, specialRequests } = req.body;

    const newBooking = await Booking.create({
      name,
      email,
      date,
      time,
      partySize,
      specialRequests
    });

    res.status(201).json(newBooking);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create booking', details: err.message });
  }
});

// Get all bookings for a user (GET /api/booking)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { email: req.user.email }
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;
