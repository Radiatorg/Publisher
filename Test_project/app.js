const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const { sequelize } = require('./models');
const errorHandler = require('./middleware/errorMiddleware');
const bodyParser = require('body-parser');
const telegramService = require('./services/TelegramService');

const indexRouter = require('./routes/index');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Настройка CORS
app.use(cors({
  origin: ['http://localhost:5173', 'http://192.168.1.6:5173'],
  credentials: true
}));

// Подключение middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Подключение маршрутов
app.use('/api', indexRouter);
// Маршрут для вебхука Telegram
app.post('/api/telegram/webhook', (req, res) => {
    telegramService.bot.handleUpdate(req.body);
    res.sendStatus(200);
});

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
