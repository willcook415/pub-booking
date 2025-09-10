'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        static associate(models) { /* none for now */ }
    }

    User.init({
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: { isEmail: true }
        },
        passwordHash: {
            type: DataTypes.STRING,
            allowNull: false
        },
        role: {
            type: DataTypes.ENUM('admin', 'staff', 'viewer'),
            allowNull: false,
            defaultValue: 'staff'
        }
    }, {
        sequelize,
        modelName: 'User',
        tableName: 'Users'
    });

    return User;
};
