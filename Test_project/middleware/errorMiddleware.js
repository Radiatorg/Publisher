module.exports = function errorHandler(err, req, res, next) {
    console.error(err.stack);

    // Обработка JWT ошибок
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Недействительный токен' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Срок действия токена истек' });
    }

    // Обработка ошибок валидации
    if (err.message.includes('Пароль должен') || err.message.includes('Некорректный email')) {
        return res.status(400).json({ message: err.message });
    }

    // Обработка ошибок пользователя
    if (err.message.includes('Пользователь')) {
        return res.status(404).json({ message: err.message });
    }

    // Обработка ошибок аутентификации
    if (err.message.includes('Не авторизован')) {
        return res.status(401).json({ message: err.message });
    }

    // Обработка ошибок базы данных
    if (err.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }

    // Обработка всех остальных ошибок
    res.status(500).json({ message: 'Внутренняя ошибка сервера' });
}; 