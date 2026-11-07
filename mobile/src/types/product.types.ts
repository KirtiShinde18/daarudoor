import { PaginatedResponse } from './api.types';

export type ProductStatus = 'Active' | 'Inactive';

export interface Product {
  _id: string;
  name: string;
  image?: string;
  imagePublicId?: string;
  category: string;
  brand?: string;
  description?: string;
  volume?: string;
  price: number;
  discountPrice?: number;
  stock: number;
  status: ProductStatus;
  averageRating: number;
  reviewCount: number;
  isDeleted: boolean;
  deletedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse extends PaginatedResponse<Product> {}

export interface ProductResponse {
  success: boolean;
  message?: string;
  data: Product;
}
