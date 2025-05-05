import axios from 'axios';

const API_URL = '/api';

interface AuthResponse {
    token: string;
    user: {
        id: number;
        email: string;
        nickname: string;
    };
}

export interface User {
    id: number;
    email: string;
    nickname: string;
    createdAt: string;
}

export const userApi = {
    // Регистрация
    async register(nickname: string, email: string, password: string): Promise<AuthResponse> {
        const response = await axios.post<AuthResponse>(`${API_URL}/users/register`, { nickname, email, password });
        return response.data;
    },

    // Вход
    async login(email: string, password: string): Promise<AuthResponse> {
        const response = await axios.post<AuthResponse>(`${API_URL}/users/login`, { email, password });
        return response.data;
    },

    // Получение профиля
    async getProfile(): Promise<User> {
        const token = localStorage.getItem('token');
        const response = await axios.get<User>(`${API_URL}/users/profile`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Получение всех пользователей
    async getUsers(): Promise<User[]> {
        const token = localStorage.getItem('token');
        const response = await axios.get<User[]>(`${API_URL}/users`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Обновление пользователя
    async update(id: number, data: { nickname?: string, email?: string, password?: string }): Promise<User> {
        const token = localStorage.getItem('token');
        const response = await axios.put<User>(`${API_URL}/users/${id}`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Удаление пользователя
    async delete(id: number): Promise<void> {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/users/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    logout: async () => {
        const response = await axios.post(`${API_URL}/auth/logout`);
        return response.data;
    },

    refresh: async () => {
        const response = await axios.get(`${API_URL}/auth/refresh`);
        return response.data;
    }
}; 