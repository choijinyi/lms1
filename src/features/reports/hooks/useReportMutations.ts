'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  CreateReportSchema,
  UpdateReportStatusSchema,
  ExecuteReportActionSchema,
  ReportResponseSchema,
  type CreateReportInput,
  type UpdateReportStatusInput,
  type ExecuteReportActionInput,
} from '@/features/reports/lib/dto';

// 신고 생성 (일반 사용자용)
const createReport = async (input: CreateReportInput) => {
  try {
    const validated = CreateReportSchema.parse(input);
    const { data } = await apiClient.post('/api/reports', validated);
    return ReportResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to create report.');
    throw new Error(message);
  }
};

export const useCreateReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

// 신고 상태 변경 (Operator 전용)
const updateReportStatus = async (reportId: string, input: UpdateReportStatusInput) => {
  try {
    const validated = UpdateReportStatusSchema.parse(input);
    const { data } = await apiClient.patch(`/api/reports/${reportId}/status`, validated);
    return ReportResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to update report status.');
    throw new Error(message);
  }
};

export const useUpdateReportStatusMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, input }: { reportId: string; input: UpdateReportStatusInput }) =>
      updateReportStatus(reportId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};

// 신고 액션 실행 (Operator 전용)
const executeReportAction = async (reportId: string, input: ExecuteReportActionInput) => {
  try {
    const validated = ExecuteReportActionSchema.parse(input);
    const { data } = await apiClient.post(`/api/reports/${reportId}/actions`, validated);
    return ReportResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to execute report action.');
    throw new Error(message);
  }
};

export const useExecuteReportActionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reportId, input }: { reportId: string; input: ExecuteReportActionInput }) =>
      executeReportAction(reportId, input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['report', variables.reportId] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });
};
