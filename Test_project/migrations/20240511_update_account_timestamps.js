'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Получаем информацию о существующих колонках
    const tableInfo = await queryInterface.describeTable('accounts');

    // Проверяем и удаляем существующие колонки в camelCase
    if (tableInfo.createdAt) {
      await queryInterface.removeColumn('accounts', 'createdAt');
    }
    if (tableInfo.updatedAt) {
      await queryInterface.removeColumn('accounts', 'updatedAt');
    }

    // Проверяем и добавляем колонки в snake_case
    if (!tableInfo.created_at) {
      await queryInterface.addColumn('accounts', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
    }

    if (!tableInfo.updated_at) {
      await queryInterface.addColumn('accounts', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableInfo = await queryInterface.describeTable('accounts');

    if (tableInfo.created_at) {
      await queryInterface.removeColumn('accounts', 'created_at');
    }
    if (tableInfo.updated_at) {
      await queryInterface.removeColumn('accounts', 'updated_at');
    }
  }
}; 