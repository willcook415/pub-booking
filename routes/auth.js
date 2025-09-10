console.log('✅ auth routes loaded');

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models');
const { User } = db;
const { body, validationResult } = require('express-validator');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

/* POST /api/auth/register  (optional: could keep admin-only) */
router.post('/register',
    [body('email').isEmail(), body('password').isLength({ min: 6 })],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { email, password, role = 'staff' } = req.body;
        try {
            const existing = await User.findOne({ where: { email: email.toLowerCase() } });
            if (existing) return res.status(400).json({ message: 'Email already in use' });

            const hash = await bcrypt.hash(password, 12);
            await User.create({ email: email.toLowerCase(), passwordHash: hash, role });
            res.status(201).json({ message: 'User registered' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

/* POST /api/auth/login  -> returns { token, role } */
router.post('/login', async (req, res) => {
    const { email, password } = req.body || {};
    try {
        const user = await User.findOne({ where: { email: String(email).toLowerCase() } });
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

        const token = jwt.sign(
            { uid: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '12h' }
        );
        res.json({ token, role: user.role });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* --- Admin-only management APIs --- */

// list users
router.get('/users', requireAuth, requireRole('admin'), async (_req, res) => {
    const users = await User.findAll({ attributes: ['id', 'email', 'role', 'createdAt'], order: [['id', 'ASC']] });
    res.json(users);
});

// create user
router.post('/users', requireAuth, requireRole('admin'),
    [body('email').isEmail(), body('password').isLength({ min: 6 }), body('role').optional().isIn(['admin', 'staff', 'viewer'])],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        const { email, password, role = 'staff' } = req.body;
        try {
            const exists = await User.findOne({ where: { email: email.toLowerCase() } });
            if (exists) return res.status(409).json({ message: 'Email already exists' });

            const hash = await bcrypt.hash(password, 12);
            const u = await User.create({ email: email.toLowerCase(), passwordHash: hash, role });
            res.status(201).json({ id: u.id, email: u.email, role: u.role });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// change role
router.patch('/users/:id/role', requireAuth, requireRole('admin'),
    [body('role').isIn(['admin', 'staff', 'viewer'])],
    async (req, res) => {
        const user = await User.findByPk(req.params.id);
        if (!user) return res.status(404).json({ message: 'Not found' });
        user.role = req.body.role;
        await user.save();
        res.json({ id: user.id, email: user.email, role: user.role });
    }
);

// self change password
router.post('/account/change-password', requireAuth, async (req, res) => {
    const { currentPassword, newPassword } = req.body || {};
    const user = await User.findByPk(req.user.uid);
    if (!user) return res.status(404).json({ message: 'Not found' });

    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ ok: true });
});

module.exports = router;
