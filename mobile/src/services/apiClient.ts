import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApiBaseUrl } from '../config/api.config';

const rawUrl = getApiBaseUrl();
const BASE_URL = rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: any) => {
    const token = (await AsyncStorage.getItem('userToken')) || (await AsyncStorage.getItem('token'));
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

export default apiClient;
