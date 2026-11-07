import { User, UserRole } from './user.types';

export interface LoginResponse {
  success: boolean;
  message: string;
  token: string;
  role: UserRole;
  user: User;
}

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface OTPResponse {
  success: boolean;
  message: string;
}

export interface VerifyOTPResponse {
  message: string;
  token?: string;
  result?: User;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user?: Partial<User>;
}
