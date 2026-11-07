import { ApiResponse, PaginatedResponse } from './api.types';

export interface Review {
  _id: string;
  product: string;
  customer: string | { _id: string; name: string; profilePic?: string };
  rating: number;
  comment: string;
  isVerifiedPurchase: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPayload {
  rating: number;
  comment: string;
}

export interface ReviewsResponse extends PaginatedResponse<Review> {}

export interface ReviewEligibilityResponse extends ApiResponse {
  canReview: boolean;
  message?: string;
}
