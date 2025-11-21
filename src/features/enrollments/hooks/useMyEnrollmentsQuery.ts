import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { EnrollmentsResponseSchema, type EnrollmentsQuery } from '../lib/dto';

export const useMyEnrollmentsQuery = (query: EnrollmentsQuery = {}) => {
  return useQuery({
    queryKey: ['my-enrollments', query],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (query.page) searchParams.set('page', query.page.toString());
      if (query.limit) searchParams.set('limit', query.limit.toString());

      const { data } = await apiClient.get(`/api/enrollments/my?${searchParams.toString()}`);
      return EnrollmentsResponseSchema.parse(data);
    },
  });
};

