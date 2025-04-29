// services/userService.js
const db = require("../models");
const User = db.User;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-super-secret-key-123456789';

// Вспомогательные функции
function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

function validateToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        return null;
    }
}

// Валидация пароля
function validatePassword(password) {
    if (!password || password.length < 5) {
        throw new Error('Пароль должен содержать минимум 5 символов');
    }
}

// Валидация email
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
        throw new Error('Некорректный email');
    }
}

// Регистрация пользователя
async function register(nickname, email, password) {
    validateEmail(email);
    validatePassword(password);
    
    const candidate = await User.findOne({ where: { email } });
    if (candidate) {
        throw new Error('Пользователь с таким email уже существует');
    }

    const hashPassword = await bcrypt.hash(password, 5);
    const user = await User.create({
        nickname,
        email,
        password: hashPassword
    });

    const token = generateToken(user);
    return { token, user: { id: user.id, email: user.email, nickname: user.nickname } };
}

// Вход пользователя
async function login(email, password) {
    validateEmail(email);
    validatePassword(password);

    const user = await User.findOne({ where: { email } });
    if (!user) {
        throw new Error('Пользователь не найден');
    }

    const isPassEquals = await bcrypt.compare(password, user.password);
    if (!isPassEquals) {
        throw new Error('Неверный пароль');
    }

    const token = generateToken(user);
    return { token, user: { id: user.id, email: user.email, nickname: user.nickname } };
}

// Получение профиля пользователя
async function getProfile(userId) {
    const user = await User.findByPk(userId);
    if (!user) {
        throw new Error('Пользователь не найден');
    }
    return { id: user.id, email: user.email, nickname: user.nickname };
}

// Получение всех пользователей
async function getUsers() {
    const users = await User.findAll();
    return users.map(user => ({
        id: user.id,
        email: user.email,
        nickname: user.nickname
    }));
}

// Обновление пользователя
async function update(id, { nickname, email, password }) {
    const user = await User.findByPk(id);
    if (!user) {
        throw new Error('Пользователь не найден');
    }

    if (email) {
        validateEmail(email);
        user.email = email;
    }
    
    if (password) {
        validatePassword(password);
        user.password = await bcrypt.hash(password, 5);
    }

    if (nickname) {
        user.nickname = nickname;
    }

    await user.save();
    return { id: user.id, email: user.email, nickname: user.nickname };
}

// Удаление пользователя
async function deleteUser(id) {
    const user = await User.findByPk(id);
    if (!user) {
        throw new Error('Пользователь не найден');
    }
    
    await user.destroy();
    return true;
}

module.exports = {
    register,
    login,
    getProfile,
    getUsers,
    update,
    delete: deleteUser,
    validateToken
};
