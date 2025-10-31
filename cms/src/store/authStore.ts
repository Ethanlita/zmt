import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  checkAuth: () => void;
  login: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,

  checkAuth: () => {
    const token = localStorage.getItem('id_token');
    if (token) {
      // In production, validate token with Cognito
      set({ isAuthenticated: true, user: { token } });
    } else {
      set({ isAuthenticated: false, user: null });
    }
  },

  login: (token: string) => {
    localStorage.setItem('id_token', token);
    set({ isAuthenticated: true, user: { token } });
  },

  logout: () => {
    localStorage.removeItem('id_token');
    set({ isAuthenticated: false, user: null });
    // Redirect to Cognito logout
    window.location.href = import.meta.env.VITE_COGNITO_LOGOUT_URL || '/';
  },
}));
