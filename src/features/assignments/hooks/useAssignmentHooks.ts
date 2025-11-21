import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';
import {
  AssignmentListResponseSchema,
  SubmissionListResponseSchema,
  type CreateAssignmentInput,
  type CreateSubmissionInput,
  type GradeSubmissionInput,
} from '../lib/dto';

export const useAssignmentsQuery = (courseId: string) => {
  return useQuery({
    queryKey: ['assignments', courseId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/assignments/course/${courseId}`);
      return AssignmentListResponseSchema.parse(data);
    },
    enabled: !!courseId,
  });
};

export const useSubmissionsQuery = (assignmentId: string) => {
  return useQuery({
    queryKey: ['submissions', assignmentId],
    queryFn: async () => {
      const { data } = await apiClient.get(`/api/assignments/${assignmentId}/submissions`);
      return SubmissionListResponseSchema.parse(data);
    },
    enabled: !!assignmentId,
  });
};

export const useAssignmentMutations = () => {
  const queryClient = useQueryClient();

  const createAssignment = useMutation({
    mutationFn: async (input: CreateAssignmentInput) => {
      const { data } = await apiClient.post('/api/assignments', input);
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['assignments', variables.courseId] });
    },
  });

  const submitAssignment = useMutation({
    mutationFn: async (input: CreateSubmissionInput) => {
      const { data } = await apiClient.post('/api/assignments/submit', input);
      return data;
    },
    onSuccess: () => {
      // TODO: Invalidate learner's dashboard or specific assignment query
      queryClient.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
  });

  const gradeSubmission = useMutation({
    mutationFn: async ({ submissionId, input }: { submissionId: string; input: GradeSubmissionInput }) => {
      const { data } = await apiClient.post(`/api/assignments/submissions/${submissionId}/grade`, input);
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate submissions list
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
    },
  });

  return { createAssignment, submitAssignment, gradeSubmission };
};

