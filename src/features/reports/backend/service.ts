import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateReportInput,
  ReportsQuery,
  UpdateReportStatusInput,
  ExecuteReportActionInput,
  ReportResponse,
  ReportsResponse,
} from './schema';
import {
  ReportResponseSchema,
  ReportsResponseSchema,
  ReportRowSchema,
} from './schema';
import { reportsErrorCodes, type ReportsServiceError } from './error';
import { success, failure, type HandlerResult } from '@/backend/http/response';

// 상태 전환 규칙
const allowedTransitions: Record<string, string[]> = {
  received: ['investigating', 'resolved'],
  investigating: ['resolved'],
  resolved: [], // 일방향 전환
};

/**
 * 신고 목록 조회 (Operator 전용)
 */
export const getReports = async (
  client: SupabaseClient,
  query: ReportsQuery,
): Promise<HandlerResult<ReportsResponse, ReportsServiceError, unknown>> => {
  let dbQuery = client
    .from('reports')
    .select(
      `
      *,
      reporter:profiles!reports_reporter_id_fkey (
        id,
        name
      )
    `,
      { count: 'exact' },
    );

  // 필터링
  if (query.status) {
    dbQuery = dbQuery.eq('status', query.status);
  }
  if (query.targetType) {
    dbQuery = dbQuery.eq('target_type', query.targetType);
  }

  // 페이지네이션
  const offset = (query.page - 1) * query.limit;
  dbQuery = dbQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + query.limit - 1);

  const { data, error, count } = await dbQuery;

  if (error) {
    return failure(500, reportsErrorCodes.createError, error.message);
  }

  // 각 신고의 대상 정보 조회
  const reportsWithTarget = await Promise.all(
    (data || []).map(async (report) => {
      const targetTitle = await getTargetTitle(client, report.target_type, report.target_id);
      const actions = await getReportActions(client, report.id);

      return {
        id: report.id,
        reporterId: report.reporter_id,
        reporterName: report.reporter?.name || 'Unknown',
        targetType: report.target_type,
        targetId: report.target_id,
        targetTitle,
        reason: report.reason,
        content: report.content,
        status: report.status,
        actions,
        createdAt: report.created_at,
        updatedAt: report.updated_at,
      };
    }),
  );

  const response: ReportsResponse = {
    reports: reportsWithTarget,
    total: count || 0,
    page: query.page,
    limit: query.limit,
  };

  const parsed = ReportsResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      reportsErrorCodes.validationError,
      'Reports response validation failed',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

/**
 * 신고 상세 조회 (Operator 전용)
 */
export const getReportById = async (
  client: SupabaseClient,
  reportId: string,
): Promise<HandlerResult<ReportResponse, ReportsServiceError, unknown>> => {
  const { data, error } = await client
    .from('reports')
    .select(
      `
      *,
      reporter:profiles!reports_reporter_id_fkey (
        id,
        name
      )
    `,
    )
    .eq('id', reportId)
    .maybeSingle();

  if (error) {
    return failure(500, reportsErrorCodes.createError, error.message);
  }

  if (!data) {
    return failure(404, reportsErrorCodes.notFound, 'Report not found');
  }

  const rowParse = ReportRowSchema.safeParse(data);
  if (!rowParse.success) {
    return failure(
      500,
      reportsErrorCodes.validationError,
      'Report row validation failed',
      rowParse.error.format(),
    );
  }

  // 대상 정보 조회
  const targetTitle = await getTargetTitle(client, data.target_type, data.target_id);

  // 처리 이력 조회
  const actions = await getReportActions(client, reportId);

  const response: ReportResponse = {
    id: data.id,
    reporterId: data.reporter_id,
    reporterName: data.reporter?.name || 'Unknown',
    targetType: data.target_type,
    targetId: data.target_id,
    targetTitle,
    reason: data.reason,
    content: data.content,
    status: data.status,
    actions,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  const parsed = ReportResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      reportsErrorCodes.validationError,
      'Report response validation failed',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

/**
 * 신고 생성 (일반 사용자용)
 */
export const createReport = async (
  client: SupabaseClient,
  userId: string,
  input: CreateReportInput,
): Promise<HandlerResult<ReportResponse, ReportsServiceError, unknown>> => {
  // 대상 존재 여부 확인
  const targetExists = await checkTargetExists(client, input.targetType, input.targetId);
  if (!targetExists) {
    return failure(404, reportsErrorCodes.targetNotFound, 'Report target not found');
  }

  // 신고 생성
  const { data, error } = await client
    .from('reports')
    .insert({
      reporter_id: userId,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
      content: input.content,
      status: 'received',
    })
    .select('*')
    .single();

  if (error) {
    return failure(500, reportsErrorCodes.createError, error.message);
  }

  // 생성된 신고 조회
  return getReportById(client, data.id);
};

/**
 * 신고 상태 변경 (Operator 전용)
 */
export const updateReportStatus = async (
  client: SupabaseClient,
  reportId: string,
  operatorId: string,
  input: UpdateReportStatusInput,
): Promise<HandlerResult<ReportResponse, ReportsServiceError, unknown>> => {
  // 신고 조회
  const { data: report } = await client
    .from('reports')
    .select('status')
    .eq('id', reportId)
    .maybeSingle();

  if (!report) {
    return failure(404, reportsErrorCodes.notFound, 'Report not found');
  }

  // 상태 전환 규칙 검증
  const currentStatus = report.status;
  const newStatus = input.status;

  if (!allowedTransitions[currentStatus]?.includes(newStatus)) {
    return failure(
      400,
      reportsErrorCodes.invalidStatusTransition,
      `Cannot transition from ${currentStatus} to ${newStatus}`,
    );
  }

  // 상태 업데이트
  const { error } = await client
    .from('reports')
    .update({ status: newStatus })
    .eq('id', reportId);

  if (error) {
    return failure(500, reportsErrorCodes.updateError, error.message);
  }

  // 처리 이력 기록 (메모가 있는 경우)
  if (input.memo) {
    await client.from('report_actions').insert({
      report_id: reportId,
      operator_id: operatorId,
      action_type: 'dismiss',
      memo: input.memo,
    });
  }

  // 업데이트된 신고 조회
  return getReportById(client, reportId);
};

/**
 * 신고 액션 실행 (Operator 전용)
 */
export const executeReportAction = async (
  client: SupabaseClient,
  reportId: string,
  operatorId: string,
  input: ExecuteReportActionInput,
): Promise<HandlerResult<ReportResponse, ReportsServiceError, unknown>> => {
  // 신고 조회
  const { data: report } = await client
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .maybeSingle();

  if (!report) {
    return failure(404, reportsErrorCodes.notFound, 'Report not found');
  }

  // 액션 실행
  let actionResult: { success: boolean; error?: string } = { success: true };

  switch (input.actionType) {
    case 'warning':
      // TODO: 경고 메시지 발송 로직 (알림 시스템 구현 후)
      break;

    case 'invalidate_submission':
      if (!input.targetId) {
        return failure(
          400,
          reportsErrorCodes.actionFailed,
          'Target ID is required for invalidate_submission action',
        );
      }
      actionResult = await invalidateSubmission(client, input.targetId);
      break;

    case 'restrict_account':
      if (!input.targetId) {
        return failure(
          400,
          reportsErrorCodes.actionFailed,
          'Target ID is required for restrict_account action',
        );
      }
      // TODO: 계정 제한 로직 (profiles 테이블에 status 컬럼 추가 필요)
      break;

    case 'dismiss':
      // 기각: 아무 조치 없음
      break;
  }

  if (!actionResult.success) {
    return failure(500, reportsErrorCodes.actionFailed, actionResult.error || 'Action failed');
  }

  // 처리 이력 기록
  await client.from('report_actions').insert({
    report_id: reportId,
    operator_id: operatorId,
    action_type: input.actionType,
    target_id: input.targetId || null,
    memo: input.memo || null,
  });

  // 신고 상태를 resolved로 변경
  await client.from('reports').update({ status: 'resolved' }).eq('id', reportId);

  // 업데이트된 신고 조회
  return getReportById(client, reportId);
};

/**
 * 제출물 무효화
 */
const invalidateSubmission = async (
  client: SupabaseClient,
  submissionId: string,
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await client
    .from('submissions')
    .update({
      score: 0,
      status: 'graded',
      feedback: '운영자에 의해 무효 처리되었습니다.',
      graded_at: new Date().toISOString(),
    })
    .eq('id', submissionId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
};

/**
 * 대상 존재 여부 확인
 */
const checkTargetExists = async (
  client: SupabaseClient,
  targetType: string,
  targetId: string,
): Promise<boolean> => {
  const tableName = getTableNameByTargetType(targetType);

  const { data } = await client.from(tableName).select('id').eq('id', targetId).maybeSingle();

  return !!data;
};

/**
 * 대상 제목 조회
 */
const getTargetTitle = async (
  client: SupabaseClient,
  targetType: string,
  targetId: string,
): Promise<string | null> => {
  const tableName = getTableNameByTargetType(targetType);

  const { data } = await client.from(tableName).select('*').eq('id', targetId).maybeSingle();

  if (!data) {
    return null;
  }

  // 대상 유형별 제목 필드 매핑
  switch (targetType) {
    case 'course':
    case 'assignment':
      return data.title;
    case 'submission':
      return `Submission ${data.id.slice(0, 8)}...`;
    case 'user':
      return data.name;
    default:
      return null;
  }
};

/**
 * 신고 처리 이력 조회
 */
const getReportActions = async (
  client: SupabaseClient,
  reportId: string,
): Promise<ReportResponse['actions']> => {
  const { data } = await client
    .from('report_actions')
    .select(
      `
      *,
      operator:profiles!report_actions_operator_id_fkey (
        id,
        name
      )
    `,
    )
    .eq('report_id', reportId)
    .order('created_at', { ascending: false });

  if (!data) {
    return [];
  }

  return data.map((action) => ({
    id: action.id,
    actionType: action.action_type,
    operatorId: action.operator_id,
    operatorName: action.operator?.name || 'Unknown',
    memo: action.memo,
    createdAt: action.created_at,
  }));
};

/**
 * 대상 유형별 테이블명 매핑
 */
const getTableNameByTargetType = (targetType: string): string => {
  switch (targetType) {
    case 'course':
      return 'courses';
    case 'assignment':
      return 'assignments';
    case 'submission':
      return 'submissions';
    case 'user':
      return 'profiles';
    default:
      throw new Error(`Unknown target type: ${targetType}`);
  }
};
