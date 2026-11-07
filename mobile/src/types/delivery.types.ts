import { ApiResponse } from './api.types';
import { Order } from './order.types';
import { User } from './user.types';

export interface DeliveryProfile extends User {
  role: 'delivery';
  // Additional delivery specific frontend derived fields can be added here
}

export interface DeliveryDashboardData {
  totalDeliveries: number;
  todayDeliveries: number;
  activeOrders: number;
  completedOrders: number;
  earnings?: number;
}

export interface DeliveryDashboardResponse extends ApiResponse {
  data: DeliveryDashboardData;
}

export interface AssignedOrdersResponse extends ApiResponse {
  orders: Order[];
}

export interface DeliveryActionPayload {
  orderId: string;
  status?: string;
  ageVerified?: boolean;
}
