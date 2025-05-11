'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Получаем информацию о существующих колонках
    const tableInfo = await queryInterface.describeTable('accounts');

    // Обновляем access_token если он существует
    if (tableInfo.access_token) {
      await queryInterface.changeColumn('accounts', 'access_token', {
        type: Sequelize.TEXT,
        allowNull: false
      });
    }

    // Обновляем refresh_token если он существует
    if (tableInfo.refresh_token) {
      await queryInterface.changeColumn('accounts', 'refresh_token', {
        type: Sequelize.TEXT,
        allowNull: true
      });
    }

    // Добавляем telegram_data только если его нет
    if (!tableInfo.telegram_data) {
      await queryInterface.addColumn('accounts', 'telegram_data', {
        type: Sequelize.JSONB,
        allowNull: true
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('accounts');

    if (tableInfo.access_token) {
      await queryInterface.changeColumn('accounts', 'access_token', {
        type: Sequelize.STRING(255),
        allowNull: false
      });
    }

    if (tableInfo.refresh_token) {
      await queryInterface.changeColumn('accounts', 'refresh_token', {
        type: Sequelize.STRING(255),
        allowNull: true
      });
    }

    if (tableInfo.telegram_data) {
      await queryInterface.removeColumn('accounts', 'telegram_data');
    }
  }
}; 