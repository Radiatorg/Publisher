import axios from 'axios';
import { Account } from '../types/account';

const API_URL = '/api';

export const accountApi = {
    // Получение всех аккаунтов
    async getAccounts(): Promise<Account[]> {
        const token = localStorage.getItem('token');
        const response = await axios.get<Account[]>(`${API_URL}/accounts`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    // Создание нового аккаунта
    async createAccount(platformId: number, accountSnId: string, accessToken: string, refreshToken?: string): Promise<Account> {
        const token = localStorage.getItem('token');
        const response = await axios.post<Account>(
            `${API_URL}/accounts`,
            { 
                platform_id: platformId,
                account_sn_id: accountSnId,
                access_token: accessToken,
                refresh_token: refreshToken
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    },

    // Удаление аккаунта
    async deleteAccount(id: number): Promise<void> {
        const token = localStorage.getItem('token');
        await axios.delete(`${API_URL}/accounts/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
    },

    async getVKData(id: number): Promise<any> {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API_URL}/accounts/${id}/vk`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    async createVKAccount(accessToken: string): Promise<Account> {
        const token = localStorage.getItem('token');
        const response = await axios.post<Account>(
            `${API_URL}/accounts/vk`, 
            { accessToken },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        return response.data;
    },

    async createTelegramAccount(telegramId: string): Promise<any> {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        console.log('Sending request with data:', { telegram_id: telegramId });

        const response = await axios.post(
            `${API_URL}/accounts/tg`,
            { telegram_id: telegramId },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return response.data;
    }
}; 