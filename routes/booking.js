// routes/booking.js
const express = require('express');
const router = express.Router();

const { Booking } = require('../models');
const authenticateToken = require('../middleware/auth');

// Helper: inline admin guard (kept simple to match current system)
function ensureAdmin(req, res) {
    if (!req.user || !req.user.isAdmin) {
        res.status(403).json({ error: 'Access denied – admin only' });
        return false;
    }
    return true;
}

/**
 * Admin create booking
 * POST /api/booking
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const { name, email, date, time, partySize, specialRequests } = req.body;

        const created = await Booking.create({
            name,
            email,
            date,
            time,
            partySize,
            specialRequests: specialRequests ?? null,
        });

        res.status(201).json(created);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create booking', details: err.message });
    }
});

/**
 * Get bookings for logged-in user (by their email)
 * GET /api/booking
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const email = req.user?.email;
        const where = email ? { email } : {};
        const bookings = await Booking.findAll({ where });
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch bookings', details: err.message });
    }
});

/**
 * Get all bookings (admin)
 * GET /api/booking/all
 */
router.get('/all', authenticateToken, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const bookings = await Booking.findAll();
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch all bookings', details: err.message });
    }
});

/**
 * Update a booking (admin)
 * PUT /api/booking/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const booking = await Booking.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        const { name, email, date, time, partySize, specialRequests, arrived } = req.body;

        if (name !== undefined) booking.name = name;
        if (email !== undefined) booking.email = email;
        if (date !== undefined) booking.date = date;
        if (time !== undefined) booking.time = time;
        if (partySize !== undefined) booking.partySize = partySize;
        if (specialRequests !== undefined) booking.specialRequests = specialRequests;
        if (typeof arrived === 'boolean') booking.arrived = arrived;

        await booking.save();
        res.json({ message: 'Booking updated', booking });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update booking', details: err.message });
    }
});

/**
 * Toggle/set arrived (admin)
 * PUT /api/booking/:id/arrived
 * - If body.arrived is boolean, set it; otherwise toggle.
 */
router.put('/:id/arrived', authenticateToken, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const booking = await Booking.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        if (typeof req.body.arrived === 'boolean') {
            booking.arrived = req.body.arrived;
        } else {
            booking.arrived = !booking.arrived;
        }

        await booking.save();
        res.json({ message: 'Arrival status updated', arrived: booking.arrived, booking });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update arrival status', details: err.message });
    }
});

/**
 * Delete booking (admin)
 * DELETE /api/booking/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const booking = await Booking.findByPk(req.params.id);
        if (!booking) return res.status(404).json({ error: 'Booking not found' });

        await booking.destroy();
        res.json({ message: 'Booking deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete booking', details: err.message });
    }
});

module.exports = router;
