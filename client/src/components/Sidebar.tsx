import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar: React.FC = () => {
    const location = useLocation();

    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <div className="w-64 bg-gray-800 text-white min-h-screen">
            <div className="p-4">
                <h2 className="text-2xl font-bold mb-8">Меню</h2>
                <nav>
                    <ul className="space-y-2">
                        <li>
                            <Link
                                to="/profile"
                                className={`block p-2 rounded hover:bg-gray-700 ${
                                    isActive('/profile') ? 'bg-gray-700' : ''
                                }`}
                            >
                                Профиль
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/posts"
                                className={`block p-2 rounded hover:bg-gray-700 ${
                                    isActive('/posts') ? 'bg-gray-700' : ''
                                }`}
                            >
                                Посты
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/accounts"
                                className={`block p-2 rounded hover:bg-gray-700 ${
                                    isActive('/accounts') ? 'bg-gray-700' : ''
                                }`}
                            >
                                Привязка аккаунтов
                            </Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
};

export default Sidebar; 