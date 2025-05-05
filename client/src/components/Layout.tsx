import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Боковая навигационная панель */}
      <nav className="bg-white shadow-lg w-64 min-h-screen">
        <div className="flex flex-col h-full">
          <div className="flex-shrink-0 px-4 py-5">
            <Link to="/dashboard" className="text-xl font-bold text-gray-800">
              Publisher
            </Link>
          </div>
          <div className="flex-1 px-4 py-4 space-y-2">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium block ${
                isActive('/dashboard') 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Главная
            </Link>
            <Link
              to="/profile"
              className={`px-3 py-2 rounded-md text-sm font-medium block ${
                isActive('/profile') 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Профиль
            </Link>
            <Link
              to="/accounts"
              className={`px-3 py-2 rounded-md text-sm font-medium block ${
                isActive('/accounts') 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Аккаунты
            </Link>
            <Link
              to="/posts"
              className={`px-3 py-2 rounded-md text-sm font-medium block ${
                isActive('/posts') 
                  ? 'bg-indigo-100 text-indigo-600' 
                  : 'text-gray-700 hover:text-indigo-600 hover:bg-indigo-50'
              }`}
            >
              Посты
            </Link>
          </div>
          <div className="px-4 py-4">
            <button
              onClick={handleLogout}
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full"
            >
              Выйти
            </button>
          </div>
        </div>
      </nav>

      {/* Основной контент */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
};

export default Layout; 