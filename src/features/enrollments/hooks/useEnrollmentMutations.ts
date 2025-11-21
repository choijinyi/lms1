import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import { EnrollmentResponseSchema, type CreateEnrollmentInput } from '../lib/dto';

export const useEnrollmentMutations = () => {
  const queryClient = useQueryClient();

  const enroll = useMutation({
    mutationFn: async (input: CreateEnrollmentInput) => {
      const { data } = await apiClient.post('/api/enrollments', input);
      return EnrollmentResponseSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
  });

  return { enroll };
};

