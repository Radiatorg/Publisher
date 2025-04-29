const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorMiddleware');
const authMiddleware = require('./middleware/authMiddleware');

const indexRouter = require('./routes/index');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Настройка CORS
app.use(cors({
  origin: 'http://localhost:5173', // Порт, на котором запущен Vite
  credentials: true
}));

// Подключение middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Подключение маршрутов
app.use('/api', indexRouter); // Добавляем префикс /api

// Middleware обработки ошибок должен быть последним
app.use(errorHandler);

// Синхронизация базы данных с моделями
sequelize.sync({ alter: true })  // Этот метод обновит таблицы без удаления данных
  .then(() => {
    console.log('Database synced');
  })
  .catch((err) => {
    console.error('Unable to sync database:', err);
  });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});

module.exports = app;
