import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PageEditor from './pages/PageEditor';
import ProductEditor from './pages/ProductEditor';
import ProductList from './pages/ProductList';
import NavigationManager from './pages/NavigationManager';
import SiteSettings from './pages/SiteSettings';
import './index.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const { checkAuth, login } = useAuthStore();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    // Handle OAuth callback with implicit flow (id_token in hash)
    const hash = window.location.hash;
    if (hash && hash.includes('id_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const idToken = params.get('id_token');
      const accessToken = params.get('access_token');
      
      if (idToken) {
        login(idToken, accessToken || undefined);
        // 清除 URL 中的 token，同时保留当前路径
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}${window.location.search}`,
        );
        setAuthReady(true);
        return;
      }
    }
    
    // Check authentication on mount (only if not handling callback)
    checkAuth();
    setAuthReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-600">正在验证登录状态...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/pages/:slug"
          element={
            <PrivateRoute>
              <PageEditor />
            </PrivateRoute>
          }
        />
        <Route
          path="/products"
          element={
            <PrivateRoute>
              <ProductList />
            </PrivateRoute>
          }
        />
        <Route
          path="/products/:id"
          element={
            <PrivateRoute>
              <ProductEditor />
            </PrivateRoute>
          }
        />
        <Route
          path="/navigation"
          element={
            <PrivateRoute>
              <NavigationManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <PrivateRoute>
              <SiteSettings />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
