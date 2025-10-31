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

// Content API
export const contentApi = {
  // Get all content of a type
  getAll: async (type: 'pages' | 'products', lang?: string) => {
    const params = lang ? { lang } : {};
    const response = await api.get(`/content/${type}`, { params });
    return response.data.items;
  },

  // Get single content by ID
  getById: async (type: 'pages' | 'products', id: string) => {
    const response = await api.get(`/content/${type}/${id}`);
    return response.data;
  },

  // Create or update content
  save: async (type: 'pages' | 'products', id: string, data: any) => {
    const response = await api.post(`/content/${type}/${id}`, data);
    return response.data;
  },

  // Delete content
  delete: async (type: 'pages' | 'products', id: string) => {
    const response = await api.delete(`/content/${type}/${id}`);
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
