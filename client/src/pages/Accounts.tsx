import React, { useEffect, useState } from 'react';
import { accountApi } from '../api/accountApi';
import { Account as AccountType } from '../types/account';
import { TelegramSessionGenerator } from '../components/TelegramSessionGenerator';
import { TextField, Alert } from '@mui/material';

interface TelegramSession {
    apiId: string;
    apiHash: string;
    session: string;
}

const STORAGE_KEY = 'telegram_api_credentials';

const Accounts: React.FC = () => {
    const [accounts, setAccounts] = useState<AccountType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showAddAccount, setShowAddAccount] = useState(false);
    const [platform, setPlatform] = useState('1');
    const [vkToken, setVkToken] = useState('');
    const [telegramSession, setTelegramSession] = useState<TelegramSession | null>(null);
    const [telegramApiId, setTelegramApiId] = useState('');
    const [telegramApiHash, setTelegramApiHash] = useState('');
    const [showApiCredentials, setShowApiCredentials] = useState(false);

    useEffect(() => {
        fetchAccounts();
        // Загружаем сохраненные API credentials
        const savedCredentials = localStorage.getItem(STORAGE_KEY);
        if (savedCredentials) {
            const { apiId, apiHash } = JSON.parse(savedCredentials);
            setTelegramApiId(apiId);
            setTelegramApiHash(apiHash);
        }
    }, []);

    const saveApiCredentials = (apiId: string, apiHash: string) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ apiId, apiHash }));
    };

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const data = await accountApi.getAccounts();
            setAccounts(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            setLoading(true);
            setError(null);
            
            if (platform === '1') {
                if (!vkToken) {
                    setError('Please enter VK token');
                    return;
                }
                await accountApi.createVKAccount(vkToken);
            } else {
                if (!telegramSession || !telegramApiId || !telegramApiHash) {
                    setError('Please complete Telegram authentication');
                    return;
                }
                // Сохраняем API credentials
                saveApiCredentials(telegramApiId, telegramApiHash);
                await accountApi.createTelegramAccount(telegramApiId, telegramApiHash, telegramSession.session);
            }
            
            setShowAddAccount(false);
            setVkToken('');
            setTelegramSession(null);
            setSuccess(`${platform === '1' ? 'VK' : 'Telegram'} account added successfully`);
            await fetchAccounts();
        } catch (err: any) {
            setError(err.response?.data?.message || `Failed to add ${platform === '1' ? 'VK' : 'Telegram'} account`);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this account?')) return;

        try {
            await accountApi.deleteAccount(id);
            setSuccess('Account deleted successfully');
            await fetchAccounts();
        } catch (err) {
            setError('Failed to delete account');
        }
    };

    if (loading && accounts.length === 0) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold">Accounts</h1>
                <button
                    onClick={() => setShowAddAccount(true)}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                    Add Account
                </button>
            </div>
            
            {/* Уведомления */}
            {error && (
                <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg">
                    {error}
                </div>
            )}
            
            {success && (
                <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg">
                    {success}
                </div>
            )}
            
            {showAddAccount && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full">
                        <h2 className="text-xl font-semibold mb-4">Add Account</h2>
                        <form onSubmit={handleAddAccount}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Platform</label>
                                <select
                                    value={platform}
                                    onChange={(e) => setPlatform(e.target.value)}
                                    className="mt-1 block w-full rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                                >
                                    <option value="1">VK</option>
                                    <option value="2">Telegram</option>
                                </select>
                            </div>

                            {platform === '1' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700">VK Token</label>
                                    <input
                                        type="text"
                                        value={vkToken}
                                        onChange={(e) => setVkToken(e.target.value)}
                                        className="mt-1 block w-full rounded-lg border border-gray-200 bg-white text-gray-900 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                                        placeholder="Enter VK token"
                                    />
                                </div>
                            )}

                            {platform === '2' && (
                                <div className="space-y-4">
                <div className="mb-4 text-sm text-gray-500 space-y-2">
                    <p className="font-medium">Чтобы подключить Telegram аккаунт:</p>
                    <ol className="list-decimal list-inside ml-2 space-y-1">
                                            <li>Получите API ID и API Hash на сайте <a href="https://my.telegram.org/apps" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">my.telegram.org/apps</a></li>
                                            <li>Создайте сессию, используя официальное приложение Telegram</li>
                                            <li>Введите полученные данные в форму ниже</li>
                    </ol>
                    <button
                        type="button"
                        onClick={() => setShowApiCredentials(!showApiCredentials)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm mt-2"
                    >
                        {showApiCredentials ? 'Скрыть сохраненные данные' : 'Показать сохраненные данные'}
                    </button>
                    {showApiCredentials && telegramApiId && telegramApiHash && (
                        <Alert severity="info" className="mt-2">
                            <p>Сохраненные данные:</p>
                            <p>API ID: {telegramApiId}</p>
                            <p>API Hash: {telegramApiHash}</p>
                        </Alert>
                    )}
                </div>
                    <div>
                                        <TextField
                                            fullWidth
                                            label="API ID"
                                            value={telegramApiId}
                                            onChange={(e) => setTelegramApiId(e.target.value)}
                                            margin="normal"
                                            required
                                            type="number"
                                        />
                                        <TextField
                                            fullWidth
                                            label="API Hash"
                                            value={telegramApiHash}
                                            onChange={(e) => setTelegramApiHash(e.target.value)}
                                            margin="normal"
                                            required
                                        />
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <TelegramSessionGenerator
                                                apiId={telegramApiId}
                                                apiHash={telegramApiHash}
                                                onSessionGenerated={(session) => setTelegramSession({ apiId: telegramApiId, apiHash: telegramApiHash, session })}
                        />
                    </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowAddAccount(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                    <button
                        type="submit"
                                    disabled={loading}
                                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                                    {loading ? 'Adding...' : 'Add Account'}
                    </button>
                            </div>
                </form>
            </div>
                </div>
            )}

            {/* Accounts List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((account) => (
                    <div key={account.id} className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-4">
                                {(account.vkData?.photo || account.telegramData?.photo) && (
                                    <div className="flex-shrink-0">
                                        <img 
                                            src={account.vkData?.photo || account.telegramData?.photo} 
                                            alt="Profile" 
                                            className="w-12 h-12 rounded-full object-cover"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'https://via.placeholder.com/48?text=No+Photo';
                                            }}
                                            style={{
                                                backgroundColor: '#f3f4f6',
                                                minWidth: '48px',
                                                minHeight: '48px'
                                            }}
                                        />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {account.platform?.name} Account
                                    </h3>
                                    <div className="text-base font-medium text-gray-800">
                                        {account.vkData?.name || account.telegramData?.name || 'Unknown User'}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-1">
                                        ID: {account.account_sn_id}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(account.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Accounts; 