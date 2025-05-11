import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

interface DeletePostParams {
    platform: 'vk' | 'telegram';
    accountId?: string;
    communityId?: string;
    channelId?: string;
    postId: string;
}

// Создаем экземпляр axios с базовыми настройками
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Добавляем перехватчик для добавления токена к каждому запросу
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const postApi = {
    async getPosts() {
        const response = await api.get('/accounts/posts');
        return response.data;
    },

    async createPost(postData: any) {
        const response = await api.post('/accounts/posts', postData);
        return response.data;
    },

    async deletePost(params: DeletePostParams) {
        const response = await api.delete('/accounts/posts', { data: params });
        return response.data;
    }
}; 