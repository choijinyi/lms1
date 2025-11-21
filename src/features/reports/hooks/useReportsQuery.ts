'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { ReportsResponseSchema, type ReportsQuery } from '@/features/reports/lib/dto';

const fetchReports = async (query: ReportsQuery) => {
  try {
    const params = new URLSearchParams();
    if (query.status) params.set('status', query.status);
    if (query.targetType) params.set('targetType', query.targetType);
    params.set('page', query.page.toString());
    params.set('limit', query.limit.toString());

    const { data } = await apiClient.get(`/api/reports?${params.toString()}`);
    return ReportsResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch reports.');
    throw new Error(message);
  }
};

export const useReportsQuery = (query: ReportsQuery) =>
  useQuery({
    queryKey: ['reports', query],
    queryFn: () => fetchReports(query),
    staleTime: 30 * 1000,
  });
