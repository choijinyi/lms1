import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CreateCourseInput,
  UpdateCourseInput,
  CoursesQuery,
  CoursesResponse,
  CourseResponse,
} from './schema';
import {
  CoursesResponseSchema,
  CourseResponseSchema,
  CourseSchema,
} from './schema';
import { coursesErrorCodes, type CoursesServiceError } from './error';
import { success, failure, type HandlerResult } from '@/backend/http/response';

/**
 * 코스 목록 조회
 */
export const getCourses = async (
  client: SupabaseClient,
  query: CoursesQuery
): Promise<HandlerResult<CoursesResponse, CoursesServiceError, unknown>> => {
  let dbQuery = client.from('courses').select('*', { count: 'exact' });

  if (query.category) {
    dbQuery = dbQuery.eq('category', query.category);
  }
  if (query.difficulty) {
    dbQuery = dbQuery.eq('difficulty', query.difficulty);
  }
  if (query.status) {
    dbQuery = dbQuery.eq('status', query.status);
  } else {
    // 기본적으로 published 상태인 코스만 조회 (관리자 페이지가 아닌 경우)
    // 여기서는 간단히 처리하지만, 실제로는 호출 컨텍스트에 따라 달라질 수 있음
    dbQuery = dbQuery.eq('status', 'published');
  }

  const offset = (query.page - 1) * query.limit;
  dbQuery = dbQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + query.limit - 1);

  const { data, error, count } = await dbQuery;

  if (error) {
    return failure(500, coursesErrorCodes.createError, error.message);
  }

  const mappedCourses = (data || []).map((course) => ({
    id: course.id,
    instructorId: course.instructor_id,
    title: course.title,
    description: course.description,
    category: course.category,
    difficulty: course.difficulty,
    curriculum: course.curriculum,
    status: course.status,
    createdAt: course.created_at,
    updatedAt: course.updated_at,
  }));

  const response: CoursesResponse = {
    courses: mappedCourses,
    total: count || 0,
    page: query.page,
    limit: query.limit,
  };

  const parsed = CoursesResponseSchema.safeParse(response);
  if (!parsed.success) {
    return failure(
      500,
      coursesErrorCodes.validationError,
      'Courses response validation failed',
      parsed.error.format()
    );
  }

  return success(parsed.data);
};

/**
 * 코스 상세 조회
 */
export const getCourseById = async (
  client: SupabaseClient,
  courseId: string
): Promise<HandlerResult<CourseResponse, CoursesServiceError, unknown>> => {
  const { data, error } = await client
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();

  if (error) {
    return failure(500, coursesErrorCodes.createError, error.message);
  }

  if (!data) {
    return failure(404, coursesErrorCodes.notFound, 'Course not found');
  }

  const mappedCourse = {
    id: data.id,
    instructorId: data.instructor_id,
    title: data.title,
    description: data.description,
    category: data.category,
    difficulty: data.difficulty,
    curriculum: data.curriculum,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  const parsed = CourseResponseSchema.safeParse(mappedCourse);
  if (!parsed.success) {
    return failure(
      500,
      coursesErrorCodes.validationError,
      'Course response validation failed',
      parsed.error.format()
    );
  }

  return success(parsed.data);
};

/**
 * 코스 생성 (Instructor only)
 */
export const createCourse = async (
  client: SupabaseClient,
  instructorId: string,
  input: CreateCourseInput
): Promise<HandlerResult<CourseResponse, CoursesServiceError, unknown>> => {
  const { data, error } = await client
    .from('courses')
    .insert({
      instructor_id: instructorId,
      title: input.title,
      description: input.description,
      category: input.category,
      difficulty: input.difficulty,
      curriculum: input.curriculum,
      status: 'draft', // 기본값
    })
    .select('*')
    .single();

  if (error) {
    return failure(500, coursesErrorCodes.createError, error.message);
  }

  const mappedCourse = {
    id: data.id,
    instructorId: data.instructor_id,
    title: data.title,
    description: data.description,
    category: data.category,
    difficulty: data.difficulty,
    curriculum: data.curriculum,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  const parsed = CourseResponseSchema.safeParse(mappedCourse);
  if (!parsed.success) {
    return failure(
      500,
      coursesErrorCodes.validationError,
      'Course creation validation failed',
      parsed.error.format()
    );
  }

  return success(parsed.data);
};

/**
 * 코스 수정 (Instructor only)
 */
export const updateCourse = async (
  client: SupabaseClient,
  courseId: string,
  instructorId: string,
  input: UpdateCourseInput
): Promise<HandlerResult<CourseResponse, CoursesServiceError, unknown>> => {
  // 1. 코스 조회 및 권한 확인
  const { data: course, error: fetchError } = await client
    .from('courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();

  if (fetchError) {
    return failure(500, coursesErrorCodes.updateError, fetchError.message);
  }

  if (!course) {
    return failure(404, coursesErrorCodes.notFound, 'Course not found');
  }

  if (course.instructor_id !== instructorId) {
    return failure(403, coursesErrorCodes.unauthorized, 'You are not the instructor of this course');
  }

  // 2. 업데이트할 필드 구성
  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.description !== undefined) updateData.description = input.description;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.difficulty !== undefined) updateData.difficulty = input.difficulty;
  if (input.curriculum !== undefined) updateData.curriculum = input.curriculum;
  if (input.status !== undefined) updateData.status = input.status;

  // 3. 코스 업데이트
  const { data, error } = await client
    .from('courses')
    .update(updateData)
    .eq('id', courseId)
    .select('*')
    .single();

  if (error) {
    return failure(500, coursesErrorCodes.updateError, error.message);
  }

  const mappedCourse = {
    id: data.id,
    instructorId: data.instructor_id,
    title: data.title,
    description: data.description,
    category: data.category,
    difficulty: data.difficulty,
    curriculum: data.curriculum,
    status: data.status,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  const parsed = CourseResponseSchema.safeParse(mappedCourse);
  if (!parsed.success) {
    return failure(
      500,
      coursesErrorCodes.validationError,
      'Course update validation failed',
      parsed.error.format()
    );
  }

  return success(parsed.data);
};

