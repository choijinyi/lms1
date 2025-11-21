import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import {
  CourseResponseSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
} from '../lib/dto';

export const useCourseMutations = () => {
  const queryClient = useQueryClient();

  const createCourse = useMutation({
    mutationFn: async (input: CreateCourseInput) => {
      const { data } = await apiClient.post('/api/courses', input);
      return CourseResponseSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
    },
  });

  const updateCourse = useMutation({
    mutationFn: async ({ courseId, input }: { courseId: string; input: UpdateCourseInput }) => {
      const { data } = await apiClient.patch(`/api/courses/${courseId}`, input);
      return CourseResponseSchema.parse(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['course', data.id] });
    },
  });

  return { createCourse, updateCourse };
};
