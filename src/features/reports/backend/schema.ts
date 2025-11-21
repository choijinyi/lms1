import { z } from 'zod';

// 신고 생성 요청 스키마 (일반 사용자용)
export const CreateReportSchema = z.object({
  targetType: z.enum(['course', 'assignment', 'submission', 'user']),
  targetId: z.string().uuid(),
  reason: z.string().min(1).max(200),
  content: z.string().min(1).max(2000),
});

// 신고 목록 조회 쿼리 파라미터 스키마
export const ReportsQuerySchema = z.object({
  status: z.enum(['received', 'investigating', 'resolved']).optional(),
  targetType: z.enum(['course', 'assignment', 'submission', 'user']).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// 신고 상태 변경 요청 스키마
export const UpdateReportStatusSchema = z.object({
  status: z.enum(['investigating', 'resolved']),
  memo: z.string().max(1000).optional(),
});

// 신고 액션 실행 요청 스키마
export const ExecuteReportActionSchema = z.object({
  actionType: z.enum(['warning', 'invalidate_submission', 'restrict_account', 'dismiss']),
  targetId: z.string().uuid().optional(),
  memo: z.string().max(1000).optional(),
});

// 신고 응답 스키마
export const ReportResponseSchema = z.object({
  id: z.string().uuid(),
  reporterId: z.string().uuid(),
  reporterName: z.string(),
  targetType: z.enum(['course', 'assignment', 'submission', 'user']),
  targetId: z.string().uuid(),
  targetTitle: z.string().nullable(),
  reason: z.string(),
  content: z.string(),
  status: z.enum(['received', 'investigating', 'resolved']),
  actions: z.array(
    z.object({
      id: z.string().uuid(),
      actionType: z.enum(['warning', 'invalidate_submission', 'restrict_account', 'dismiss']),
      operatorId: z.string().uuid(),
      operatorName: z.string(),
      memo: z.string().nullable(),
      createdAt: z.string(),
    }),
  ),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 신고 목록 응답 스키마
export const ReportsResponseSchema = z.object({
  reports: z.array(ReportResponseSchema),
  total: z.number().int(),
  page: z.number().int(),
  limit: z.number().int(),
});

// DB Row 스키마
export const ReportRowSchema = z.object({
  id: z.string().uuid(),
  reporter_id: z.string().uuid(),
  target_type: z.enum(['course', 'assignment', 'submission', 'user']),
  target_id: z.string().uuid(),
  reason: z.string(),
  content: z.string(),
  status: z.enum(['received', 'investigating', 'resolved']),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ReportActionRowSchema = z.object({
  id: z.string().uuid(),
  report_id: z.string().uuid(),
  operator_id: z.string().uuid(),
  action_type: z.enum(['warning', 'invalidate_submission', 'restrict_account', 'dismiss']),
  target_id: z.string().uuid().nullable(),
  memo: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CreateReportInput = z.infer<typeof CreateReportSchema>;
export type ReportsQuery = z.infer<typeof ReportsQuerySchema>;
export type UpdateReportStatusInput = z.infer<typeof UpdateReportStatusSchema>;
export type ExecuteReportActionInput = z.infer<typeof ExecuteReportActionSchema>;
export type ReportResponse = z.infer<typeof ReportResponseSchema>;
export type ReportsResponse = z.infer<typeof ReportsResponseSchema>;
export type ReportRow = z.infer<typeof ReportRowSchema>;
export type ReportActionRow = z.infer<typeof ReportActionRowSchema>;
