import axios from 'axios';

const baseURL = 'http://localhost:4000/api'; // Обновляем URL и добавляем префикс /api

export const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Добавляем интерсептор для добавления токена к каждому запросу
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Добавляем интерсептор для обработки ошибок
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Если токен истек или недействителен, перенаправляем на страницу входа
            localStorage.removeItem('token');
            // Используем window.location.href для принудительного перехода на страницу входа
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
); 