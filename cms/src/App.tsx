import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PageEditor from './pages/PageEditor';
import ProductEditor from './pages/ProductEditor';
import ProductList from './pages/ProductList';
import ProductSeriesManager from './pages/ProductSeriesManager';
import PageList from './pages/PageList';
import UpdatesList from './pages/UpdatesList';
import UpdateEditor from './pages/UpdateEditor';
import NavigationManager from './pages/NavigationManager';
import SiteSettings from './pages/SiteSettings';
import HomeAbout from './pages/HomeAbout';
import UserGuide from './pages/UserGuide';
import NotificationBar from './components/NotificationBar';
import './index.css';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

function App() {
  const { checkAuth, handleCodeExchange } = useAuthStore();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const code = searchParams.get('code');
      const redirectUri = window.location.origin;

      if (code) {
        const exchanged = await handleCodeExchange(code, redirectUri);
        if (!exchanged) {
          console.error('Failed to complete login via authorization code');
        }
        // Clean query parameters
        window.history.replaceState(null, '', window.location.pathname);
      }

      await checkAuth();
      setAuthReady(true);
    };

    initialize();
  }, [checkAuth, handleCodeExchange]);

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="text-gray-600">正在验证登录状态...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <NotificationBar />
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
          path="/pages"
          element={
            <PrivateRoute>
              <PageList />
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
          path="/series"
          element={
            <PrivateRoute>
              <ProductSeriesManager />
            </PrivateRoute>
          }
        />
        <Route
          path="/updates"
          element={
            <PrivateRoute>
              <UpdatesList />
            </PrivateRoute>
          }
        />
        <Route
          path="/updates/:id"
          element={
            <PrivateRoute>
              <UpdateEditor />
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
        <Route
          path="/home-about"
          element={
            <PrivateRoute>
              <HomeAbout />
            </PrivateRoute>
          }
        />
        <Route
          path="/guide"
          element={
            <PrivateRoute>
              <UserGuide />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
