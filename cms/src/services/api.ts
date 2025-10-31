import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.zunmingtea.com';

// Axios instance with auth interceptor
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('id_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type ContentType = 'pages' | 'products';

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
  saveFooter: async (footer: any) => {
    const response = await api.post('/settings/footer', { footer });
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

export default api;
