import { create } from 'zustand';

interface AuthTokens {
  idToken: string;
  accessToken?: string;
  refreshToken?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: AuthTokens | null;
  checkAuth: () => Promise<void>;
  ensureValidSession: () => Promise<void>;
  login: (idToken: string, accessToken?: string, refreshToken?: string) => void;
  handleCodeExchange: (code: string, redirectUri: string) => Promise<boolean>;
  refreshTokens: () => Promise<boolean>;
  logout: (options?: { skipRedirect?: boolean }) => void;
}

const decodeJwt = (token: string): any | null => {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized);
    return JSON.parse(decoded);
  } catch (error) {
    console.warn('Failed to decode token', error);
    return null;
  }
};

const isTokenExpired = (token: string, skewSeconds: number = 60): boolean => {
  const payload = decodeJwt(token);
  if (!payload?.exp) {
    return true;
  }
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp <= currentTime + skewSeconds;
};

let refreshPromise: Promise<boolean> | null = null;

export const useAuthStore = create<AuthState>((set, get) => {
  const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN || 'us-east-1t7myjypr0';
  const cognitoClientId = import.meta.env.VITE_COGNITO_CLIENT_ID || '3l2enft1vanfn7l0e27b88j9gr';
  const cognitoRegion = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
  const tokenEndpoint = `https://${cognitoDomain}.auth.${cognitoRegion}.amazoncognito.com/oauth2/token`;

  const persistSession = ({ idToken, accessToken, refreshToken }: AuthTokens) => {
    localStorage.setItem('id_token', idToken);
    if (accessToken) {
      localStorage.setItem('access_token', accessToken);
    }
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }

    const storedAccess = accessToken || localStorage.getItem('access_token') || undefined;
    const storedRefresh = refreshToken || localStorage.getItem('refresh_token') || undefined;

    set({
      isAuthenticated: true,
      user: {
        idToken,
        accessToken: storedAccess,
        refreshToken: storedRefresh,
      },
    });
  };

  const clearSession = () => {
    localStorage.removeItem('id_token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({ isAuthenticated: false, user: null });
  };

  return {
    isAuthenticated: false,
    user: null,

    checkAuth: async () => {
      const idToken = localStorage.getItem('id_token');
      if (!idToken) {
        clearSession();
        return;
      }

      if (isTokenExpired(idToken)) {
        const refreshed = await get().refreshTokens();
        if (!refreshed) {
          get().logout();
          return;
        }
        return;
      }

      persistSession({
        idToken,
        accessToken: localStorage.getItem('access_token') || undefined,
        refreshToken: localStorage.getItem('refresh_token') || undefined,
      });
    },

    ensureValidSession: async () => {
      const idToken = localStorage.getItem('id_token');
      if (!idToken) {
        clearSession();
        return;
      }

      if (isTokenExpired(idToken)) {
        const refreshed = await get().refreshTokens();
        if (!refreshed) {
          get().logout();
        }
      }
    },

    login: (idToken: string, accessToken?: string, refreshToken?: string) => {
      persistSession({ idToken, accessToken, refreshToken });
    },

    handleCodeExchange: async (code: string, redirectUri: string) => {
      const body = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: cognitoClientId,
        code,
        redirect_uri: redirectUri,
      });

      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        console.error('Failed to exchange authorization code', await response.text());
        return false;
      }

      const data = await response.json();
      if (!data.id_token) {
        console.error('Token response missing id_token');
        return false;
      }

      persistSession({
        idToken: data.id_token,
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
      return true;
    },

    refreshTokens: async () => {
      if (refreshPromise) {
        return refreshPromise;
      }

      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        return false;
      }

      const executeRefresh = async () => {
        const body = new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: cognitoClientId,
          refresh_token: refreshToken,
        });

        try {
          const response = await fetch(tokenEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: body.toString(),
          });

          if (!response.ok) {
            console.error('Failed to refresh tokens', await response.text());
            return false;
          }

          const data = await response.json();
          if (!data.id_token) {
            console.error('Refresh response missing id_token');
            return false;
          }

          persistSession({
            idToken: data.id_token,
            accessToken: data.access_token,
            refreshToken: data.refresh_token || refreshToken,
          });
          return true;
        } catch (error) {
          console.error('Unexpected error refreshing tokens', error);
          return false;
        } finally {
          refreshPromise = null;
        }
      };

      refreshPromise = executeRefresh();
      return refreshPromise;
    },

    logout: (options?: { skipRedirect?: boolean }) => {
      clearSession();

      if (options?.skipRedirect) {
        return;
      }

      const logoutUri = window.location.origin;
      window.location.href = `https://${cognitoDomain}.auth.${cognitoRegion}.amazoncognito.com/logout?client_id=${cognitoClientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
    },
  };
});
