'use client';
import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useSessionStore } from '@/stores/session';
import { connectSocket } from '@/lib/socket';


interface LoginResponse {
  data: { accessToken: string; refreshToken?: string; user: { id: string; fullName: string; email: string; role: string } };
}

export function useSignup() {
  return useMutation({
    mutationFn: (body: { fullName: string; email: string; birthDate: string; gender: string; password: string }) =>
      api<{ data: { email: string } }>('/auth/signup', {
        method: 'POST', skipAuth: true, body: JSON.stringify(body),
      }),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (body: { email: string; code: string }) =>
      api<{ data: { verified: boolean } }>('/auth/verify-email', {
        method: 'POST', skipAuth: true, body: JSON.stringify(body),
      }),
  });
}



export function useLogin() {
  return useMutation({
    mutationFn: (body: { identifier: string; password: string }) =>   
      api<LoginResponse>('/auth/login', { method: 'POST', skipAuth: true, body: JSON.stringify(body) }),
    onSuccess: (json) => {
      useSessionStore.getState().setSession(json.data.accessToken, json.data.user, json.data.refreshToken);
      connectSocket();
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (email: string) =>
      api<{ data: { email: string } }>('/auth/resend-otp', {
        method: 'POST', skipAuth: true, body: JSON.stringify({ email }),
      }),
  });
}