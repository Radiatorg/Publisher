import React, { createContext, useContext, useState } from 'react';
import { authApi } from '../api/authApi';

interface User {
    id: number;
    email: string;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    setToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    isAuthenticated: false,
    login: async () => {},
    logout: () => {},
    setToken: () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        return !!localStorage.getItem('token');
    });

    const login = async (email: string, password: string) => {
        const response = await authApi.login(email, password);
        if (response.token) {
            localStorage.setItem('token', response.token);
            setUser(response.user);
            setIsAuthenticated(true);
        }
    };

    const logout = () => {
            localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
        authApi.logout();
    };

    const setToken = (token: string) => {
        localStorage.setItem('token', token);
        setIsAuthenticated(true);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, login, logout, setToken }}>
            {children}
        </AuthContext.Provider>
    );
}; 