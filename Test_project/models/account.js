'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Account extends Model {
    static associate(models) {
      this.belongsTo(models.User, {
        foreignKey: 'user_id',
        as: 'user',
      });

      this.belongsTo(models.Platform, {
        foreignKey: 'platform_id',
        as: 'platform',
      });
    }
  }

  Account.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    platform_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'platforms',
        key: 'id',
      },
    },
    account_sn_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    access_token: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    refresh_token: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  }, {
    sequelize,
    modelName: 'Account',
    tableName: 'accounts',
    timestamps: false,
  });

  return Account;
};