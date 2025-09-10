'use strict';

module.exports = {
    async up(q, Sequelize) {
        // ensure table exists (skip if it already does)
        await q.sequelize.transaction(async (t) => {
            // add new columns
            await q.addColumn('Users', 'passwordHash', { type: Sequelize.STRING, allowNull: true }, { transaction: t });
            await q.addColumn('Users', 'role', { type: Sequelize.ENUM('admin', 'staff', 'viewer'), allowNull: false, defaultValue: 'staff' }, { transaction: t });

            // backfill passwordHash from legacy password column if it existed
            try {
                await q.sequelize.query('UPDATE "Users" SET "passwordHash" = "password" WHERE "passwordHash" IS NULL', { transaction: t });
            } catch (e) { /* ignore if old column doesn't exist */ }

            // make email required + unique
            await q.changeColumn('Users', 'email', { type: Sequelize.STRING, allowNull: false, unique: true }, { transaction: t });

            // drop old columns if present
            try { await q.removeColumn('Users', 'password', { transaction: t }); } catch (e) { }
            try { await q.removeColumn('Users', 'isAdmin', { transaction: t }); } catch (e) { }
            try { await q.removeColumn('Users', 'name', { transaction: t }); } catch (e) { }
        });
    },

    async down(q, Sequelize) {
        await q.sequelize.transaction(async (t) => {
            await q.addColumn('Users', 'password', { type: Sequelize.STRING, allowNull: true }, { transaction: t });
            await q.addColumn('Users', 'isAdmin', { type: Sequelize.BOOLEAN, defaultValue: false }, { transaction: t });
            await q.addColumn('Users', 'name', { type: Sequelize.STRING }, { transaction: t });

            await q.sequelize.query('UPDATE "Users" SET "password" = "passwordHash"', { transaction: t });

            await q.removeColumn('Users', 'passwordHash', { transaction: t });
            await q.removeColumn('Users', 'role', { transaction: t });

            await q.changeColumn('Users', 'email', { type: Sequelize.STRING, allowNull: true }, { transaction: t });
            await q.sequelize.query('DROP TYPE IF EXISTS "enum_Users_role";', { transaction: t });
        });
    }
};
