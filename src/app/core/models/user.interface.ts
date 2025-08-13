export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  oauthProvider?: OAuthProvider;
  oauthId?: string;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}

export enum OAuthProvider {
  GOOGLE = 'GOOGLE',
  FACEBOOK = 'FACEBOOK'
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

export interface OAuthLoginRequest {
  provider: OAuthProvider;
  code: string;
  redirectUri: string;
}

export interface OAuthLoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  isNewUser: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
