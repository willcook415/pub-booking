// config/config.js
require('dotenv').config();

const common = {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: { require: true, rejectUnauthorized: false }
    },
    migrationStorage: 'sequelize',
    seederStorage: 'sequelize'
};

module.exports = {
    development: { url: process.env.DATABASE_URL, ...common },
    test: { url: process.env.DATABASE_URL, ...common },
    production: { url: process.env.DATABASE_URL, ...common }
};
