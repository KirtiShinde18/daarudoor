import { ApiResponse } from './api.types';
import { AddressType } from './address.types';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
export type PaymentMethod = 'COD' | 'Razorpay' | 'ONLINE';
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'SUCCESS' | 'REFUND_PENDING';
export type DeliveryAgeVerificationStatus = 'NOT_REQUIRED' | 'PENDING' | 'VERIFIED' | 'FAILED';

export interface OrderProduct {
  _id?: string;
  product: string;
  name: string;
  image?: string;
  category?: string;
  volume?: string;
  price: number;
  quantity: number;
}

export interface DeliveryAddressInfo {
  fullName?: string;
  mobile?: string;
  houseNo?: string;
  building?: string;
  area?: string;
  landmark?: string;
  city?: string;
  state?: string;
  pincode?: string;
  addressType?: string;
}

export interface DeliveryAgeVerification {
  status: DeliveryAgeVerificationStatus;
  verifiedAt?: string;
  verifiedBy?: string;
  failureReason?: string;
}

export interface Order {
  _id: string;
  customer: string;
  deliveryPartner?: string;
  deliveryAddress: DeliveryAddressInfo;
  products: OrderProduct[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  status: OrderStatus;
  deliveryAgeVerification?: DeliveryAgeVerification;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderPayload {
  addressId: string;
  paymentMethod: PaymentMethod;
}

export interface OrderResponse extends ApiResponse {
  data?: Order | Order[];
}
