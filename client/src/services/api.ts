import axios from 'axios';

const API_BASE_URL = 'http://192.168.1.6:5173/api'; // Adjust this to match your backend URL

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  nickname: string;
  email: string;
  password: string;
}

export const userApi = {
  login: (credentials: LoginCredentials) =>
    api.post('/users/login', credentials),
  register: (userData: RegisterData) =>
    api.post('/users/register', userData),
  getProfile: () => api.get('/users/profile'),
};

export const accountApi = {
  getAccounts: () => api.get('/accounts'),
  createAccount: (accountData: any) => api.post('/accounts', accountData),
  updateAccount: (id: string, accountData: any) =>
    api.put(`/accounts/${id}`, accountData),
};

export const platformApi = {
  getPlatforms: () => api.get('/platforms'),
  createPlatform: (platformData: any) => api.post('/platforms', platformData),
  updatePlatform: (id: string, platformData: any) =>
    api.put(`/platforms/${id}`, platformData),
};

export default api; 