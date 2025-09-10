'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
    async up(q) {
        const emails = (process.env.ADMIN_SEED_EMAILS || '')
            .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        const password = process.env.ADMIN_SEED_PASSWORD || '';
        if (!emails.length || !password) {
            console.log('Seed skipped: set ADMIN_SEED_EMAILS & ADMIN_SEED_PASSWORD');
            return;
        }
        const hash = await bcrypt.hash(password, 12);
        const now = new Date();
        await q.bulkInsert('Users', emails.map(email => ({
            email, passwordHash: hash, role: 'admin', createdAt: now, updatedAt: now
        })));
    },
    async down(q) {
        const emails = (process.env.ADMIN_SEED_EMAILS || '')
            .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        if (emails.length) await q.bulkDelete('Users', { email: emails });
    }
};
