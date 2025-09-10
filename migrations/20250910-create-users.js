'use strict';
module.exports = {
    async up(q, Sequelize) {
        await q.createTable('Users', {
            id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
            email: { type: Sequelize.STRING, allowNull: false, unique: true },
            passwordHash: { type: Sequelize.STRING, allowNull: false },
            role: { type: Sequelize.ENUM('admin', 'staff', 'viewer'), allowNull: false, defaultValue: 'staff' },
            createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
            updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') }
        });
        await q.addIndex('Users', ['email'], { unique: true, name: 'users_email_unique' });
    },
    async down(q) {
        await q.dropTable('Users');
        await q.sequelize.query('DROP TYPE IF EXISTS "enum_Users_role";');
    }
};