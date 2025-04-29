// controllers/userController.js
const UserService = require('../services/userService');

// Получение всех пользователей
exports.getUsers = async (req, res, next) => {
    try {
        const users = await UserService.getUsers();
        res.json(users);
    } catch (error) {
        next(error);
    }
};

// Создание нового пользователя
exports.create = async (req, res) => {
    try {
        const { nickname, email, password } = req.body;
        const user = await UserService.create(nickname, email, password);
        res.status(201).json({ message: "Пользователь создан", user });
    } catch (err) {
        res.status(500).json({ error: 'Failed to create user' });
    }
};

// Обновление пользователя по ID
exports.update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const userData = req.body;
        const updatedUser = await UserService.update(id, userData);
        res.json(updatedUser);
    } catch (error) {
        next(error);
    }
};

// Удаление пользователя по ID
exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        await UserService.delete(id);
        res.json({ message: 'Пользователь успешно удален' });
    } catch (error) {
        next(error);
    }
};

// Регистрация пользователя
exports.register = async (req, res, next) => {
    try {
        const { nickname, email, password } = req.body;
        const result = await UserService.register(nickname, email, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Вход пользователя
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await UserService.login(email, password);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Выход пользователя
exports.logout = async (req, res) => {
    try {
        res.json({ message: 'Вы успешно вышли из системы' });
    } catch (err) {
        res.status(500).json({ error: 'Ошибка при выходе из системы' });
    }
};

// Получение профиля пользователя
exports.getProfile = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const user = await UserService.getProfile(userId);
        res.json(user);
    } catch (error) {
        next(error);
    }
};
