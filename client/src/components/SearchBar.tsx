import React from 'react';

interface SearchBarProps {
    onSearch: (query: string) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    return (
        <div className="relative">
            <input
                type="text"
                placeholder="Поиск по тексту постов..."
                onChange={(e) => onSearch(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <svg
                    className="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
            </div>
        </div>
    );
}; 