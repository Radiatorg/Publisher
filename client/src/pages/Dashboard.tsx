import React, { useEffect, useState } from 'react';
import { accountApi } from '../api/accountApi';

interface Account {
  id: number;
  platform_id: number;
  account_sn_id: string;
  access_token: string;
  refresh_token?: string;
  created_at: string;
  platform?: {
    id: number;
    name: string;
  };
}

const Dashboard: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const accountsResponse = await accountApi.getAccounts();
        setAccounts(accountsResponse);
      } catch (err) {
        setError('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Your Accounts</h2>
          {accounts.length === 0 ? (
            <p className="text-gray-500">No accounts found</p>
          ) : (
            <ul className="space-y-2">
              {accounts.map((account) => (
                <li
                  key={account.id}
                  className="p-3 bg-gray-50 rounded hover:bg-gray-100"
                >
                  <div className="font-medium">{account.platform?.name}</div>
                  <div className="text-sm text-gray-500">ID: {account.account_sn_id}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 