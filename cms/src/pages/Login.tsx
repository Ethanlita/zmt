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

  const base64UrlEncode = (buffer: ArrayBuffer | Uint8Array) => {
    const uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    const len = uint8Array.byteLength;
    for (let i = 0; i < len; i += 1) {
      binary += String.fromCharCode(uint8Array[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const generateCodeVerifier = () => {
    const array = new Uint8Array(64);
    window.crypto.getRandomValues(array);
    return base64UrlEncode(array);
  };

  const generateCodeChallenge = async (verifier: string) => {
    const data = new TextEncoder().encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(digest);
  };

  const handleLogin = async () => {
    const redirectUri = window.location.origin;
    const scope = encodeURIComponent('email openid phone offline_access');

    const codeVerifier = generateCodeVerifier();
    sessionStorage.setItem('pkce_code_verifier', codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const loginUrl = `https://${COGNITO_DOMAIN}.auth.${COGNITO_REGION}.amazoncognito.com/login?client_id=${COGNITO_CLIENT_ID}&response_type=code&scope=${scope}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;
    window.location.href = loginUrl;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 to-primary-800">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h1 className="text-3xl font-bold text-center mb-2 text-primary-800">尊茗茶业</h1>
        <p className="text-center text-gray-600 mb-8">内容管理系统</p>
        
        <button
          onClick={() => {
            void handleLogin();
          }}
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
