export type UserRole = 'customer' | 'delivery' | 'admin';

export type Gender = 'Male' | 'Female';

export type UserAgeVerificationStatus = 'NOT_STARTED' | 'PENDING' | 'VERIFIED' | 'FAILED' | 'EXPIRED';

export interface AgeVerification {
  status: UserAgeVerificationStatus;
  dateOfBirth?: string;
  verifiedAt?: string;
  verificationReference?: string;
  provider?: string;
  failureReason?: string;
}

export interface UserLocation {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: UserRole;
  active: boolean;
  profilePic?: string;
  
  // Customer specific
  gender?: Gender;
  birthYear?: number;
  onboardingCompleted?: boolean;
  location?: UserLocation;
  ageVerification?: AgeVerification;
  ageVerified?: boolean; // Convenience flag returned by API
  
  // Delivery/Admin specific
  department?: string;
  
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string;
  mobile?: string;
  profilePic?: string;
}

export interface UpdateLocationPayload extends UserLocation {}
