'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { ReportResponseSchema } from '@/features/reports/lib/dto';

const fetchReport = async (reportId: string) => {
  try {
    const { data } = await apiClient.get(`/api/reports/${reportId}`);
    return ReportResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch report.');
    throw new Error(message);
  }
};

export const useReportQuery = (reportId: string) =>
  useQuery({
    queryKey: ['report', reportId],
    queryFn: () => fetchReport(reportId),
    enabled: Boolean(reportId),
    staleTime: 30 * 1000,
  });
