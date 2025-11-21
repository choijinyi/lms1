import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateEnrollmentInput,
  EnrollmentsQuery,
  EnrollmentsResponse,
  EnrollmentResponse,
} from './schema';
import {
  EnrollmentsResponseSchema,
  EnrollmentResponseSchema,
} from './schema';
import { enrollmentsErrorCodes, type EnrollmentsServiceError } from './error';
import { success, failure, type HandlerResult } from '@/backend/http/response';

/**
 * 수강 신청 (Enroll)
 */
export const createEnrollment = async (
  client: SupabaseClient,
  userId: string,
  input: CreateEnrollmentInput
): Promise<HandlerResult<EnrollmentResponse, EnrollmentsServiceError, unknown>> => {
  // 이미 수강 중인지 확인
  const { data: existing } = await client
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_id', input.courseId)
    .maybeSingle();

  if (existing) {
    return failure(400, enrollmentsErrorCodes.alreadyEnrolled, 'Already enrolled in this course');
  }

  const { data, error } = await client
    .from('enrollments')
    .insert({
      user_id: userId,
      course_id: input.courseId,
    })
    .select('*')
    .single();

  if (error) {
    return failure(500, enrollmentsErrorCodes.createError, error.message);
  }

  const mappedEnrollment = {
    id: data.id,
    userId: data.user_id,
    courseId: data.course_id,
    enrolledAt: data.enrolled_at,
    canceledAt: data.canceled_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  const parsed = EnrollmentResponseSchema.safeParse(mappedEnrollment);
  if (!parsed.success) {
    return failure(
      500,
      enrollmentsErrorCodes.validationError,
      'Enrollment creation validation failed',
      parsed.error.format()
    );
  }

  return success(parsed.data);
};

/**
 * 내 수강 목록 조회
 */
export const getMyEnrollments = async (
  client: SupabaseClient,
  userId: string,
  query: EnrollmentsQuery
): Promise<HandlerResult<EnrollmentsResponse, EnrollmentsServiceError, unknown>> => {
  const offset = (query.page - 1) * query.limit;
  
  const { data, error, count } = await client
    .from('enrollments')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('enrolled_at', { ascending: false })
    .range(offset, offset + query.limit - 1);

  if (error) {
    return failure(500, enrollmentsErrorCodes.createError, error.message);
  }

  const mappedEnrollments = (data || []).map((enrollment) => ({
    id: enrollment.id,
    userId: enrollment.user_id,
    courseId: enrollment.course_id,
    enrolledAt: enrollment.enrolled_at,
    canceledAt: enrollment.canceled_at,
    createdAt: enrollment.created_at,
    updatedAt: enrollment.updated_at,
  }));

  const response: EnrollmentsResponse = {
    enrollments: mappedEnrollments,
    total: count || 0,
    page: query.page,
    limit: query.limit,
  };

  const parsed = EnrollmentsResponseSchema.safeParse(response);
  if (!parsed.success) {
    return failure(
      500,
      enrollmentsErrorCodes.validationError,
      'Enrollments response validation failed',
      parsed.error.format()
    );
  }

  return success(parsed.data);
};

