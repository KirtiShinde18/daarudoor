import apiClient from '../services/apiClient';

export const getCustomerProfile = async () => {
  const response = await apiClient.get('/auth/customer/me');
  return response.data;
};

// ... other customer endpoints
