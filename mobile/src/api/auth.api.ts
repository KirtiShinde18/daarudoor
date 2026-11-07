import apiClient from '../services/apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const loginUser = async (email: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || { message: 'An error occurred during login' };
  }
};

export const logoutUser = async () => {
  await AsyncStorage.multiRemove(['userToken', 'userRole', 'userData']);
};
