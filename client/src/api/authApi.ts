import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const authApi = {
    async login(email: string, password: string) {
        const response = await axios.post(`${API_URL}/auth/login`, { email, password });
        return response.data;
    },

    async logout() {
        const token = localStorage.getItem('token');
        if (token) {
            await axios.post(`${API_URL}/auth/logout`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
        }
    },

    async checkAuth() {
        const response = await axios.get(`${API_URL}/auth/check`);
        return response.data;
    }
}; 