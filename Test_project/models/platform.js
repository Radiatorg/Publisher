const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Platform extends Model {
    static associate(models) {
      // Связь "один ко многим" с Account
      this.hasMany(models.Account, {
        foreignKey: 'platform_id',
        as: 'accounts',
      });
    }
  }

  Platform.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
      },
    },
  }, {
    sequelize,
    modelName: 'Platform',
    tableName: 'platforms',
    timestamps: false,
  });

  return Platform;
};