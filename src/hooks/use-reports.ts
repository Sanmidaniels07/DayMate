'use client';
import { useMutation, useQuery  } from '@tanstack/react-query';
import { api } from '@/lib/api';


export type ReportTargetType = 'USER' | 'POST' | 'MESSAGE' | 'COMMENT';

export const REPORT_REASONS = [
  { key: 'HARASSMENT', label: 'Harassment or bullying' },
  { key: 'SPAM', label: 'Spam' },
  { key: 'INAPPROPRIATE_CONTENT', label: 'Inappropriate content' },
  { key: 'FAKE_PROFILE', label: 'Fake profile' },
  { key: 'UNDERAGE_USER', label: 'Underage user' },
  { key: 'SCAM_OR_FRAUD', label: 'Scam or fraud' },
  { key: 'OTHER', label: 'Something else' },
] as const;

export function useReport() {
  return useMutation({
    mutationFn: (input: {
      targetType: ReportTargetType;
      targetId: string; // username for USER, id for POST/MESSAGE/COMMENT
      reason: string;
      details?: string;
    }) => api<{ data: { reportId: string; duplicate: boolean } }>('/reports', {
      method: 'POST', body: JSON.stringify(input),
    }),
  });
}


export interface MyReport {
  id: string;
  targetType: 'USER' | 'POST' | 'MESSAGE' | 'COMMENT';
  reason: string;
  status: 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
}

export function useMyReports() {
  return useQuery({
    queryKey: ['reports', 'mine'],
    queryFn: () => api<{ data: MyReport[] }>('/reports/mine'),
  });
}