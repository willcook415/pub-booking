// models/ClosedDay.js
module.exports = (sequelize, DataTypes) => {
    const ClosedDay = sequelize.define('ClosedDay', {
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            unique: true
        },
        note: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'closed_days',
        timestamps: true
    });
    return ClosedDay;
};
