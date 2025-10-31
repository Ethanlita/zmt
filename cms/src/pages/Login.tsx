import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN || 'us-east-1t7myjypr0';
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '3l2enft1vanfn7l0e27b88j9gr';
const COGNITO_REGION = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    // Use current origin as redirect_uri (works with any domain)
    const redirectUri = window.location.origin;
    const loginUrl = `https://${COGNITO_DOMAIN}.auth.${COGNITO_REGION}.amazoncognito.com/login?client_id=${COGNITO_CLIENT_ID}&response_type=token&scope=email+openid+phone&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary-800">尊茗茶业</h1>
        <p className="text-center text-gray-600 mb-8">内容管理系统</p>
        
        <button
          onClick={handleLogin}
          className="w-full btn-primary py-3 text-lg"
        >
          登录
        </button>
        
        <p className="text-sm text-gray-500 text-center mt-6">
          使用您的管理员账户登录
        </p>
      </div>
    </div>
  );
};

export default Login;
