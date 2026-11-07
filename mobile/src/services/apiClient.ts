import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEFAULT_LOCAL = Platform.OS === 'android' ? 'http://10.0.2.2:5500/api' : 'http://127.0.0.1:5500/api';
let BASE_URL = process.env.EXPO_PUBLIC_API_URL || (__DEV__ ? DEFAULT_LOCAL : 'https://api.daarudoor.com/api');

if (BASE_URL && !BASE_URL.endsWith('/api')) {
  BASE_URL = `${BASE_URL.replace(/\/$/, '')}/api`;
}

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
