import axios from 'axios';
import { Account } from '../types/account';
import { api } from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export interface Community {
    id: number;
    name: string;
    photo: string;
    type: string;
}

export const accountApi = {
    // Получение всех аккаунтов
    async getAccounts(): Promise<Account[]> {
        const token = localStorage.getItem('token');
        console.log('Getting accounts with token:', token);
        try {
            const response = await axios.get(`${API_URL}/accounts`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Accounts response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching accounts:', error);
            throw error;
        }
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

    async createTelegramAccount(apiId: string, apiHash: string, session: string): Promise<Account> {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/accounts/telegram`, {
            apiId,
            apiHash,
            session
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    async startTelegramAuth(data: { apiId: number; apiHash: string; phoneNumber: string }): Promise<void> {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/telegram/start-auth`, {
            apiId: data.apiId,
            apiHash: data.apiHash,
            phoneNumber: data.phoneNumber
        }, {
            headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    },

    async verifyTelegramCode(data: { apiId: number; apiHash: string; phoneNumber: string; code: string }): Promise<{ session: string; requiresPassword: boolean }> {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/telegram/verify-code`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    async submitTelegramPassword(data: { apiId: number; apiHash: string; phoneNumber: string; password: string }): Promise<{ session: string }> {
        const token = localStorage.getItem('token');
        const response = await axios.post(`${API_URL}/telegram/submit-password`, data, {
            headers: { Authorization: `Bearer ${token}` }
        });
        return response.data;
    },

    async getVKCommunities(accountId: number): Promise<Community[]> {
        const token = localStorage.getItem('token');
        console.log('Getting VK communities for account:', accountId);
        try {
            const response = await axios.get(`${API_URL}/accounts/${accountId}/communities`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('VK communities response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching VK communities:', error);
            throw error;
        }
    },

    async getTelegramChannels(accountId: number): Promise<Community[]> {
        const token = localStorage.getItem('token');
        console.log('Getting Telegram channels for account:', accountId);
        try {
            const response = await axios.get(`${API_URL}/accounts/${accountId}/channels`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Telegram channels response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching Telegram channels:', error);
            throw error;
        }
    }
}; 