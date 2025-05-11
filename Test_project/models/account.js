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
      type: DataTypes.TEXT,
      allowNull: false,
    },
    refresh_token: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    telegram_data: {
      type: DataTypes.JSONB,
      allowNull: true,
    }
  }, {
    sequelize,
    modelName: 'Account',
    tableName: 'accounts',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return Account;
};