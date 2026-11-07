import { ApiResponse } from './api.types';

export type AddressType = 'Home' | 'Work' | 'Other';

export interface Address {
  _id: string;
  user: string;
  fullName: string;
  mobile: string;
  houseNo: string;
  building?: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  addressType: AddressType;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AddAddressPayload {
  fullName: string;
  mobile: string;
  houseNo: string;
  building?: string;
  area: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  addressType?: AddressType;
  isDefault?: boolean;
}

export interface UpdateAddressPayload extends Partial<AddAddressPayload> {}

export interface AddressResponse extends ApiResponse {
  address?: Address;
  addresses?: Address[];
}
