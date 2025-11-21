import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { CoursesResponseSchema, type CoursesQuery } from '../lib/dto';

export const useCoursesQuery = (query: CoursesQuery = {}) => {
  return useQuery({
    queryKey: ['courses', query],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (query.page) searchParams.set('page', query.page.toString());
      if (query.limit) searchParams.set('limit', query.limit.toString());
      if (query.category) searchParams.set('category', query.category);
      if (query.difficulty) searchParams.set('difficulty', query.difficulty);
      if (query.status) searchParams.set('status', query.status);

      const { data } = await apiClient.get(`/api/courses?${searchParams.toString()}`);
      return CoursesResponseSchema.parse(data);
    },
  });
};

