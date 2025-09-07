// routes/closedDays.js
const express = require('express');
const router = express.Router();
const { ClosedDay } = require('../models'); // adjust path if needed

// Public: list closed days (optionally bounded by from/to)
router.get('/', async (req, res) => {
    try {
        const { from, to } = req.query;
        const where = {};
        if (from) where.date = { ...(where.date || {}), $gte: from };
        if (to) where.date = { ...(where.date || {}), $lte: to };
        // Using Sequelize v6 operators:
        if (from || to) {
            const { Op } = require('sequelize');
            where.date = {
                ...(from ? { [Op.gte]: from } : {}),
                ...(to ? { [Op.lte]: to } : {}),
            };
        }
        const rows = await ClosedDay.findAll({ where, order: [['date', 'ASC']] });
        res.json(rows.map(r => ({ date: r.date, note: r.note })));
    } catch (e) {
        res.status(500).json({ error: 'Failed to fetch closed days' });
    }
});

// Admin only: add a closed day
router.post('/', async (req, res) => {
    try {
        const { date, note } = req.body;
        if (!date) return res.status(400).json({ error: 'date is required (YYYY-MM-DD)' });
        const row = await ClosedDay.create({ date, note: note || null });
        res.status(201).json({ date: row.date, note: row.note });
    } catch (e) {
        if (e.name === 'SequelizeUniqueConstraintError') {
            return res.status(409).json({ error: 'Day already marked closed' });
        }
        res.status(500).json({ error: 'Failed to create closed day' });
    }
});

// Admin only: remove a closed day by date
router.delete('/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const n = await ClosedDay.destroy({ where: { date } });
        if (!n) return res.status(404).json({ error: 'Not found' });
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: 'Failed to delete closed day' });
    }
});

module.exports = router;
