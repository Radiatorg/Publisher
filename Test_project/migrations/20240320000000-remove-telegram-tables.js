'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Удаляем таблицы
    await queryInterface.dropTable('TelegramMessages');
    await queryInterface.dropTable('TelegramChannels');
  },

  down: async (queryInterface, Sequelize) => {
    // Восстанавливаем таблицы
    await queryInterface.createTable('TelegramChannels', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      channelId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING
      },
      username: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      photo: {
        type: Sequelize.STRING
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      account_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Accounts',
          key: 'id'
        }
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.createTable('TelegramMessages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      messageId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      channelId: {
        type: Sequelize.STRING,
        allowNull: false
      },
      text: {
        type: Sequelize.TEXT
      },
      date: {
        type: Sequelize.DATE
      },
      type: {
        type: Sequelize.STRING
      },
      media: {
        type: Sequelize.ARRAY(Sequelize.STRING)
      },
      views: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      forwards: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      isPinned: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  }
}; 