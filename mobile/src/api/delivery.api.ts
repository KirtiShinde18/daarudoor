import apiClient from '../services/apiClient';

export const getDeliveryDashboardStats = async () => {
  const response = await apiClient.get('/delivery/dashboard-stats');
  return response.data;
};

export const getAssignedOrders = async (startDate?: string, endDate?: string) => {
  let url = '/delivery/orders';
  if (startDate || endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    url += `?${params.toString()}`;
  }
  const response = await apiClient.get(url);
  return response.data;
};

export const getDeliveryOrderDetails = async (id: string) => {
  const response = await apiClient.get(`/delivery/orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id: string, status: string) => {
  const response = await apiClient.put(`/delivery/orders/${id}/status`, { status });
  return response.data;
};

export const updateOrderLocation = async (
  id: string, 
  latitude: number, 
  longitude: number, 
  heading?: number,
  speed?: number,
  accuracy?: number
) => {
  const response = await apiClient.put(`/delivery/orders/${id}/location`, { 
    latitude, 
    longitude, 
    heading,
    speed,
    accuracy 
  });
  return response.data;
};

export const getDeliveryProfile = async () => {
  const response = await apiClient.get('/delivery/profile');
  return response.data;
};

export const updateDeliveryProfile = async (data: any) => {
  const response = await apiClient.put('/delivery/profile', data);
  return response.data;
};
