'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Booking.init({
    name: DataTypes.STRING,
    email: DataTypes.STRING,
    date: DataTypes.DATE,
    time: DataTypes.STRING,
    partySize: DataTypes.INTEGER,
      specialRequests: DataTypes.STRING,

      arrived: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
      }
  }, {
    sequelize,
    modelName: 'Booking',
  });
  return Booking;
};