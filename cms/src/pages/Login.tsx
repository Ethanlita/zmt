import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const COGNITO_LOGIN_URL = import.meta.env.VITE_COGNITO_LOGIN_URL || 'https://auth.zunmingtea.com/login';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = () => {
    window.location.href = COGNITO_LOGIN_URL;
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
