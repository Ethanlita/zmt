import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  checkAuth: () => void;
  login: (idToken: string, accessToken?: string, refreshToken?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  checkAuth: () => {
    const idToken = localStorage.getItem('id_token');
    const accessToken = localStorage.getItem('access_token');
    if (idToken) {
      // In production, validate token with Cognito
      set({ 
        isAuthenticated: true, 
        user: { idToken, accessToken } 
      });
    } else {
      set({ isAuthenticated: false, user: null });
    }
  },

  login: (idToken: string, accessToken?: string, refreshToken?: string) => {
    localStorage.setItem('id_token', idToken);
    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
    set({ 
      isAuthenticated: true, 
      user: { idToken, accessToken, refreshToken } 
    });
  },

  logout: () => {
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ isAuthenticated: false, user: null });
    
    // Redirect to Cognito logout with dynamic redirect_uri
    const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN || 'us-east-1t7myjypr0';
    const cognitoClientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '3l2enft1vanfn7l0e27b88j9gr';
    const cognitoRegion = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
    const logoutUri = window.location.origin;
    
    window.location.href = `https://${cognitoDomain}.auth.${cognitoRegion}.amazoncognito.com/logout?client_id=${cognitoClientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  },
}));
