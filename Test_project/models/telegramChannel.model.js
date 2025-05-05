const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class TelegramChannel extends Model {
        static associate(models) {
            this.belongsTo(models.Account, {
                foreignKey: 'account_id',
                as: 'account',
            });
            this.hasMany(models.TelegramMessage, {
                foreignKey: 'channel_id',
                as: 'messages',
            });
        }
    }

    TelegramChannel.init({
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        channelId: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
            },
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        username: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: true,
            },
        },
        photo: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true,
        },
        account_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'accounts',
                key: 'id',
            },
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
    }, {
        sequelize,
        modelName: 'TelegramChannel',
        tableName: 'telegram_channels',
        timestamps: false,
    });

    return TelegramChannel;
}; 