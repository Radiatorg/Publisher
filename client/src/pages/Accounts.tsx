import React, { useEffect, useState } from 'react';
import { accountApi } from '../api/accountApi';
import { Account as AccountType } from '../types/account';

const Accounts: React.FC = () => {
    const [accounts, setAccounts] = useState<AccountType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState('');
    const [telegramId, setTelegramId] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [isAddingTelegram, setIsAddingTelegram] = useState(false);

    useEffect(() => {
        fetchAccounts();
    }, []);

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

    const handleAddVKAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken) return;

        try {
            setIsAdding(true);
            setError(null);
            setSuccess(null);
            
            await accountApi.createVKAccount(accessToken);
            setAccessToken('');
            setSuccess('VK account added successfully');
            
            await fetchAccounts();
        } catch (err) {
            setError('Failed to add VK account');
        } finally {
            setIsAdding(false);
        }
    };

    const handleAddTelegramAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!telegramId) return;

        try {
            setIsAddingTelegram(true);
            setError(null);
            setSuccess(null);
            
            await accountApi.createTelegramAccount(telegramId);
            setTelegramId('');
            setSuccess('Telegram account added successfully');
            
            await fetchAccounts();
        } catch (err) {
            setError('Failed to add Telegram account');
        } finally {
            setIsAddingTelegram(false);
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
            <h1 className="text-2xl font-bold mb-8">Accounts</h1>
            
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
            
            {/* VK Account Form */}
            <div className="mb-8 bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Add VK Account</h2>
                <form onSubmit={handleAddVKAccount} className="space-y-4">
                    <div>
                        <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700">
                            VK Access Token
                        </label>
                        <input
                            type="text"
                            id="accessToken"
                            value={accessToken}
                            onChange={(e) => setAccessToken(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                            placeholder="Enter VK access token"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isAdding ? 'Adding...' : 'Add VK Account'}
                    </button>
                </form>
            </div>

            {/* Telegram Account Form */}
            <div className="mb-8 bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold mb-4">Add Telegram Account</h2>
                <div className="mb-4 text-sm text-gray-500 space-y-2">
                    <p className="font-medium">Чтобы подключить Telegram аккаунт:</p>
                    <ol className="list-decimal list-inside ml-2 space-y-1">
                        <li>Найдите нашего бота в Telegram: <a href="https://t.me/publicher_test_bot" target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-800">@publicher_test_bot</a></li>
                        <li>Отправьте команду /start боту</li>
                        <li>Бот ответит вам сообщением с вашим Telegram ID</li>
                        <li>Скопируйте ID и вставьте его в поле выше</li>
                    </ol>
                </div>
                <form onSubmit={handleAddTelegramAccount} className="space-y-4">
                    <div>
                        <label htmlFor="telegramId" className="block text-sm font-medium text-gray-700">
                            Telegram ID
                        </label>
                        <input
                            type="text"
                            id="telegramId"
                            value={telegramId}
                            onChange={(e) => setTelegramId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 bg-white"
                            placeholder="Enter your Telegram ID"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isAddingTelegram}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isAddingTelegram ? 'Adding...' : 'Add Telegram Account'}
                    </button>
                </form>
            </div>

            {/* Accounts List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {accounts.map((account) => (
                    <div key={account.id} className="bg-white p-6 rounded-lg shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    {account.platform?.name} Account
                                </h3>
                                {(account.vkData || account.telegramData) && (
                                    <div className="flex items-center mt-2">
                                        <img 
                                            src={account.vkData?.photo || account.telegramData?.photo} 
                                            alt="Profile" 
                                            className="w-12 h-12 rounded-full mr-3"
                                        />
                                        <span className="text-base font-medium text-gray-800">
                                            {account.vkData?.name || account.telegramData?.name}
                                        </span>
                                    </div>
                                )}
                                <p className="text-sm text-gray-500 mt-2">
                                    ID: {account.account_sn_id}
                                </p>
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