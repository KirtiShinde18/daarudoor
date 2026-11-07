import { Product } from './product.types';

export interface CartItem {
  id: string; // Product ID
  name: string;
  image: string;
  price: number;
  quantity: number;
  volume?: string;
  category?: string;
  brand?: string;
}

export interface CartState {
  items: CartItem[];
}

export interface AddToCartPayload extends CartItem {}

export interface UpdateCartQuantityPayload {
  id: string;
  quantity: number;
}
