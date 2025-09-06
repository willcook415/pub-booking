// routes/booking.js
const express = require('express');
const router = express.Router();

const { Booking } = require('../models');
const authenticateToken = require('../middleware/auth');

const CAPACITY_PER_SLOT = Number(process.env.CAPACITY_PER_SLOT || 24);
const SLOT_LENGTH_MIN = 15;
const BOOKING_DURATION_MIN = 180;
const SLOTS_PER_BOOKING = BOOKING_DURATION_MIN / SLOT_LENGTH_MIN;

const ALLOWED_TIMES = [
    "11:00", "11:15", "11:30", "11:45",
    "12:00", "12:15", "12:30", "12:45",
    "13:00", "13:15", "13:30", "13:45",
    "14:00", "14:15", "14:30", "14:45",
    "15:00", "15:15", "15:30", "15:45",
    "16:00", "16:15", "16:30", "16:45",
    "17:00", "17:15", "17:30", "17:45",
    "18:00", "18:15", "18:30", "18:45",
    "19:00", "19:15", "19:30", "19:45",
    "20:00", "20:15", "20:30", "20:45",
    "21:00"
];

function slotsCoveredBy(start, times = ALLOWED_TIMES) {
    const idx = times.indexOf(start);
    if (idx < 0) return [];
    return times.slice(idx, idx + SLOTS_PER_BOOKING);
}

async function wouldExceedCapacity({ date, time, partySize, excludeId = null }) {
    const sameDay = await Booking.findAll({ where: { date } });
    const load = Object.fromEntries(ALLOWED_TIMES.map(t => [t, 0]));

    for (const b of sameDay) {
        if (excludeId && b.id === Number(excludeId)) continue;
        for (const s of slotsCoveredBy(b.time)) {
            load[s] += Number(b.partySize || 0);
        }
    }
    for (const s of slotsCoveredBy(time)) {
        const after = load[s] + Number(partySize || 0);
        if (after > CAPACITY_PER_SLOT) {
            return { exceeds: true, slot: s, load: after, cap: CAPACITY_PER_SLOT };
        }
    }
    return { exceeds: false };
}


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

        // capacity check
        const cap = await wouldExceedCapacity({
            date, time, partySize
        });
        if (cap.exceeds) {
            return res.status(409).json({
                error: `Capacity exceeded at ${cap.slot} (${cap.load}/${cap.cap}). Pick a different time.`
            });
        }

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

        const data = req.body;

        const nextDate = data.date ?? booking.date;
        const nextTime = data.time ?? booking.time;
        const nextParty = data.partySize ?? booking.partySize;

        const cap = await wouldExceedCapacity({
            date: nextDate,
            time: nextTime,
            partySize: nextParty,
            excludeId: booking.id
        });
        if (cap.exceeds) {
            return res.status(409).json({
                error: `Capacity exceeded at ${cap.slot} (${cap.load}/${cap.cap}).`
            });
        }

        const { name, email, date, time, partySize, specialRequests, arrived } = data;

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
