import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.zunmingtea.com';

// Axios instance with auth interceptor
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests (with refresh if needed)
api.interceptors.request.use(
  async (config) => {
    const { ensureValidSession } = useAuthStore.getState();
    await ensureValidSession();

    const token = localStorage.getItem('id_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

type ContentType = 'pages' | 'products' | 'updates' | 'series';

// Content API
export const contentApi = {
  // Get all content of a type
  getAll: async (type: ContentType, lang?: string, extraParams: Record<string, string> = {}) => {
    const baseParams = lang ? { lang } : {};
    const response = await api.get(`/content/${type}`, { params: { ...baseParams, ...extraParams } });
    return response.data.items;
  },

  // Get single content by ID
  getById: async (type: ContentType, id: string) => {
    const response = await api.get(`/content/${type}/${id}`);
    return response.data;
  },

  // Create or update content
  save: async (type: ContentType, id: string, data: any) => {
    const response = await api.post(`/content/${type}/${id}`, data);
    return response.data;
  },

  // Delete content
  delete: async (type: ContentType, id: string) => {
    const response = await api.delete(`/content/${type}/${id}`);
    return response.data;
  },
};

// Navigation API
export const navigationApi = {
  getTree: async () => {
    const response = await api.get('/navigation');
    return response.data.tree;
  },
  saveTree: async (tree: any[]) => {
    const response = await api.post('/navigation', { tree });
    return response.data;
  },
};

// Settings API
export const settingsApi = {
  getSiteSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },
  getPublicSettings: async () => {
    const response = await api.get('/settings/public');
    return response.data;
  },
  saveFooter: async (footer: any, homeHero?: any) => {
    const response = await api.post('/settings/footer', { footer, homeHero });
    return response.data;
  },
};

// Translation API
export const translateApi = {
  translate: async (text: string, sourceLang: string = 'zh', targetLang: string = 'en') => {
    const response = await api.post('/translate', {
      text,
      sourceLang,
      targetLang,
    });
    return response.data.translatedText;
  },
};

// Publish API
export const publishApi = {
  triggerBuild: async () => {
    const response = await api.post('/publish');
    return response.data;
  },
};

export const updatesApi = {
  getChannels: async (): Promise<string[]> => {
    const response = await api.get('/content/updates/channels');
    return response.data.channels || [];
  },
};

export const mediaApi = {
  requestUpload: async (payload: { fileName: string; contentType: string; folder?: string }) => {
    const response = await api.post('/media/upload', payload);
    return response.data;
  },
};

export const actionsApi = {
  getWorkflowStatus: async () => {
    const response = await api.get('/services/actions/status');
    return response.data.statuses || [];
  },
};

export default api;
