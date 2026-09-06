import { getApiBaseUrl } from './api';

// Helper to ensure cookies are sent securely
const fetchAuth = async (endpoint: string, body?: any) => {
  const options: RequestInit = {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include', // CRITICAL: Sends the HttpOnly cookie
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(`${getApiBaseUrl()}${endpoint}`, options);
  
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || 'Authentication failed');
  }
  
  return res.json();
};

export const authApi = {
  signup: (data: any) => fetchAuth('/auth/signup', data),
  verifySignup: (data: any) => fetchAuth('/auth/signup/verify-otp', data),
  login: (data: any) => fetchAuth('/auth/login', data),
  forgotPassword: (data: any) => fetchAuth('/auth/forgot-password', data),
  resetPassword: (data: any) => fetchAuth('/auth/reset-password', data),
  logout: () => fetchAuth('/auth/logout', {}),
  getMe: () => fetchAuth('/auth/me'),
  // FIX: Added the mapping for the Resend OTP button
  resendOtp: (data: any) => fetchAuth('/auth/resend-otp', data),
};