import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Accounts from './pages/Accounts';
import Posts from './pages/Posts';
import Layout from './components/Layout';

const AppRoutes: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <Layout>
                <Profile />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/accounts"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <Layout>
                <Accounts />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/posts"
          element={
            <PrivateRoute isAuthenticated={isAuthenticated}>
              <Layout>
                <Posts />
              </Layout>
            </PrivateRoute>
          }
        />
        <Route
          path="/"
          element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />}
        />
      </Routes>
    </Router>
  );
};

const PrivateRoute = ({ children, isAuthenticated }: { children: React.ReactNode; isAuthenticated: boolean }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
