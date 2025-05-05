const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class TelegramMessage extends Model {
        static associate(models) {
            // Связь с каналом
            this.belongsTo(models.TelegramChannel, {
                foreignKey: 'channel_id',
                as: 'channel'
            });
        }
    }

    TelegramMessage.init({
        messageId: {
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true
        },
        channelId: {
            type: DataTypes.STRING,
            allowNull: false
        },
        text: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        date: {
            type: DataTypes.DATE,
            allowNull: false
        },
        type: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'text'
        },
        media: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: []
        },
        views: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        forwards: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        isPinned: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        }
    }, {
        sequelize,
        modelName: 'TelegramMessage',
        tableName: 'telegram_messages',
        timestamps: false
    });

    return TelegramMessage;
}; 