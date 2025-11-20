# UC-008: 코스 관리 (Instructor) - Implementation Plan

## 개요

### Backend Modules
| 모듈명 | 위치 | 설명 |
|--------|------|------|
| Courses Service | `src/features/courses/backend/service.ts` | 코스 CRUD 비즈니스 로직 (생성, 조회, 수정, 상태 전환) |
| Courses Route | `src/features/courses/backend/route.ts` | 코스 API 라우트 정의 (POST/GET/PATCH) |
| Courses Schema | `src/features/courses/backend/schema.ts` | 요청/응답 zod 스키마 정의 |
| Courses Error | `src/features/courses/backend/error.ts` | 에러 코드 정의 |

### Frontend Modules
| 모듈명 | 위치 | 설명 |
|--------|------|------|
| Course Mutations | `src/features/courses/hooks/useCourseMutations.ts` | 코스 생성/수정/상태전환 Mutation 훅 |
| Course Query | `src/features/courses/hooks/useCourseQuery.ts` | 단일 코스 조회 Query 훅 |
| Course DTO | `src/features/courses/lib/dto.ts` | Backend 스키마 재노출 |
| Course Form Component | `src/features/courses/components/course-form.tsx` | 코스 생성/수정 폼 컴포넌트 |
| Course Status Button | `src/features/courses/components/course-status-button.tsx` | 상태 전환 버튼 컴포넌트 |
| Course Detail Component | `src/features/courses/components/course-detail.tsx` | 코스 상세 정보 표시 컴포넌트 |
| Course New Page | `src/app/(protected)/instructor/courses/new/page.tsx` | 코스 생성 페이지 |
| Course Edit Page | `src/app/(protected)/instructor/courses/[id]/edit/page.tsx` | 코스 수정 페이지 |
| Course Detail Page | `src/app/(protected)/instructor/courses/[id]/page.tsx` | 코스 상세 페이지 |

---

## Diagram

```mermaid
graph TB
    subgraph Frontend
        NewPage[Course New Page<br/>courses/new/page.tsx]
        EditPage[Course Edit Page<br/>courses/[id]/edit/page.tsx]
        DetailPage[Course Detail Page<br/>courses/[id]/page.tsx]

        CourseForm[CourseForm Component<br/>components/course-form.tsx]
        CourseDetail[CourseDetail Component<br/>components/course-detail.tsx]
        StatusButton[CourseStatusButton Component<br/>components/course-status-button.tsx]

        Mutations[useCourseMutations Hook<br/>hooks/useCourseMutations.ts]
        Query[useCourseQuery Hook<br/>hooks/useCourseQuery.ts]
        DTO[Course DTO<br/>lib/dto.ts]
    end

    subgraph Backend
        Route[Courses Route<br/>backend/route.ts<br/>POST /api/courses<br/>GET /api/courses/:id<br/>PATCH /api/courses/:id<br/>PATCH /api/courses/:id/status]
        Service[Courses Service<br/>backend/service.ts]
        Schema[Courses Schema<br/>backend/schema.ts]
        Error[Courses Error<br/>backend/error.ts]
    end

    subgraph Database
        Courses[(courses)]
        Categories[(metadata_categories)]
        Difficulties[(metadata_difficulties)]
        Profiles[(profiles)]
    end

    NewPage --> CourseForm
    EditPage --> CourseForm
    EditPage --> Query
    DetailPage --> CourseDetail
    DetailPage --> StatusButton
    DetailPage --> Query

    CourseForm --> Mutations
    StatusButton --> Mutations
    Mutations --> DTO
    Query --> DTO

    Mutations --> |HTTP POST/PATCH| Route
    Query --> |HTTP GET| Route

    Route --> Service
    Route --> Schema
    Service --> Schema
    Service --> Error
    Service --> Courses
    Service --> Categories
    Service --> Difficulties
    Service --> Profiles

    DTO -.re-export.-> Schema
```

---

## Implementation Plan

### 1. Backend: Courses Schema (`src/features/courses/backend/schema.ts`)

**책임**: 요청/응답 데이터 구조 정의 및 검증

**구현 내용**:
```typescript
import { z } from 'zod';

// 코스 생성 요청 스키마
export const CreateCourseSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  category: z.string().min(1),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  curriculum: z.record(z.any()).optional(), // JSONB
});

// 코스 수정 요청 스키마
export const UpdateCourseSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional().nullable(),
  category: z.string().min(1).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  curriculum: z.record(z.any()).optional().nullable(),
});

// 코스 상태 전환 요청 스키마
export const UpdateCourseStatusSchema = z.object({
  status: z.enum(['published', 'archived']),
});

// 코스 응답 스키마
export const CourseResponseSchema = z.object({
  id: z.string().uuid(),
  instructorId: z.string().uuid(),
  instructorName: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  curriculum: z.record(z.any()).nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// DB Row 스키마
export const CourseRowSchema = z.object({
  id: z.string().uuid(),
  instructor_id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  category: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  curriculum: z.record(z.any()).nullable(),
  status: z.enum(['draft', 'published', 'archived']),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CourseWithInstructorRowSchema = CourseRowSchema.extend({
  instructor: z.object({
    name: z.string(),
  }),
});

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;
export type UpdateCourseStatusInput = z.infer<typeof UpdateCourseStatusSchema>;
export type CourseResponse = z.infer<typeof CourseResponseSchema>;
export type CourseRow = z.infer<typeof CourseRowSchema>;
export type CourseWithInstructorRow = z.infer<typeof CourseWithInstructorRowSchema>;
```

**의존성**:
- `zod` 패키지

---

### 2. Backend: Courses Error (`src/features/courses/backend/error.ts`)

**책임**: 에러 코드 정의

**구현 내용**:
```typescript
export const coursesErrorCodes = {
  notFound: 'COURSE_NOT_FOUND',
  createError: 'COURSE_CREATE_ERROR',
  updateError: 'COURSE_UPDATE_ERROR',
  validationError: 'COURSE_VALIDATION_ERROR',
  unauthorized: 'COURSE_UNAUTHORIZED',
  forbidden: 'COURSE_FORBIDDEN',
  invalidTransition: 'COURSE_INVALID_TRANSITION',
  invalidCategory: 'COURSE_INVALID_CATEGORY',
} as const;

type CoursesErrorValue = (typeof coursesErrorCodes)[keyof typeof coursesErrorCodes];

export type CoursesServiceError = CoursesErrorValue;
```

**의존성**: 없음

---

### 3. Backend: Courses Service (`src/features/courses/backend/service.ts`)

**책임**: 코스 CRUD 비즈니스 로직

**구현 내용**:
```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import {
  CreateCourseSchema,
  UpdateCourseSchema,
  UpdateCourseStatusSchema,
  CourseResponseSchema,
  CourseRowSchema,
  CourseWithInstructorRowSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
  type UpdateCourseStatusInput,
  type CourseResponse,
} from './schema';
import { coursesErrorCodes, type CoursesServiceError } from './error';

/**
 * 카테고리 유효성 검증
 */
const validateCategory = async (
  client: SupabaseClient,
  category: string,
): Promise<boolean> => {
  const { data } = await client
    .from('metadata_categories')
    .select('name')
    .eq('name', category)
    .eq('active', true)
    .single();

  return !!data;
};

/**
 * 상태 전환 가능 여부 확인
 */
const isValidTransition = (
  currentStatus: 'draft' | 'published' | 'archived',
  targetStatus: 'published' | 'archived',
): boolean => {
  const validTransitions: Record<string, string[]> = {
    draft: ['published', 'archived'],
    published: ['archived'],
    archived: [],
  };

  return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
};

/**
 * DB Row를 Response로 변환
 */
const mapCourseToResponse = (row: any): CourseResponse => {
  return {
    id: row.id,
    instructorId: row.instructor_id,
    instructorName: row.instructor?.name || 'Unknown',
    title: row.title,
    description: row.description,
    category: row.category,
    difficulty: row.difficulty,
    curriculum: row.curriculum,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * 코스 생성
 */
export const createCourse = async (
  client: SupabaseClient,
  instructorId: string,
  input: CreateCourseInput,
): Promise<HandlerResult<CourseResponse, CoursesServiceError, unknown>> => {
  // 1. 입력값 검증
  const validated = CreateCourseSchema.safeParse(input);

  if (!validated.success) {
    return failure(
      400,
      coursesErrorCodes.validationError,
      'Invalid course data',
      validated.error.format(),
    );
  }

  // 2. 카테고리 유효성 검증
  const isCategoryValid = await validateCategory(client, validated.data.category);

  if (!isCategoryValid) {
    return failure(
      400,
      coursesErrorCodes.invalidCategory,
      'Invalid or inactive category',
    );
  }

  // 3. 코스 생성
  const { data, error } = await client
    .from('courses')
    .insert({
      instructor_id: instructorId,
      title: validated.data.title,
      description: validated.data.description || null,
      category: validated.data.category,
      difficulty: validated.data.difficulty,
      curriculum: validated.data.curriculum || null,
      status: 'draft',
    })
    .select(`
      *,
      instructor:profiles!courses_instructor_id_fkey (
        name
      )
    `)
    .single();

  if (error) {
    return failure(500, coursesErrorCodes.createError, error.message);
  }

  const parsed = CourseWithInstructorRowSchema.safeParse(data);

  if (!parsed.success) {
    return failure(
      500,
      coursesErrorCodes.validationError,
      'Course response validation failed',
      parsed.error.format(),
    );
  }

  const response = mapCourseToResponse(parsed.data);

  return success(response, 201);
};

/**
 * 코스 조회 (단일)
 */
export const getCourseById = async (
  client: SupabaseClient,
  courseId: string,
): Promise<HandlerResult<CourseResponse, CoursesServiceError, unknown>> => {
  const { data, error } = await client
    .from('courses')
    .select(`
      *,
      instructor:profiles!courses_instructor_id_fkey (
        name
      )
    `)
    .eq('id', courseId)
    .single();

  if (error || !data) {
    return failure(404, coursesErrorCodes.notFound, 'Course not found');
  }

  const parsed = CourseWithInstructorRowSchema.safeParse(data);

  if (!parsed.success) {
    return failure(
      500,
      coursesErrorCodes.validationError,
      'Course response validation failed',
      parsed.error.format(),
    );
  }

  const response = mapCourseToResponse(parsed.data);

  return success(response);
};

/**
 * 코스 수정
 */
export const updateCourse = async (
  client: SupabaseClient,
  courseId: string,
  instructorId: string,
  input: UpdateCourseInput,
): Promise<HandlerResult<CourseResponse, CoursesServiceError, unknown>> => {
  // 1. 코스 존재 및 소유자 확인
  const { data: course } = await client
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();

  if (!course) {
    return failure(404, coursesErrorCodes.notFound, 'Course not found');
  }

  if (course.instructor_id !== instructorId) {
    return failure(403, coursesErrorCodes.forbidden, 'Not the course owner');
  }

  // 2. 입력값 검증
  const validated = UpdateCourseSchema.safeParse(input);

  if (!validated.success) {
    return failure(
      400,
      coursesErrorCodes.validationError,
      'Invalid course data',
      validated.error.format(),
    );
  }

  // 3. 카테고리 유효성 검증 (카테고리 변경 시)
  if (validated.data.category) {
    const isCategoryValid = await validateCategory(client, validated.data.category);

    if (!isCategoryValid) {
      return failure(
        400,
        coursesErrorCodes.invalidCategory,
        'Invalid or inactive category',
      );
    }
  }

  // 4. 코스 업데이트
  const updateData: Record<string, any> = {};

  if (validated.data.title !== undefined) {
    updateData.title = validated.data.title;
  }
  if (validated.data.description !== undefined) {
    updateData.description = validated.data.description;
  }
  if (validated.data.category !== undefined) {
    updateData.category = validated.data.category;
  }
  if (validated.data.difficulty !== undefined) {
    updateData.difficulty = validated.data.difficulty;
  }
  if (validated.data.curriculum !== undefined) {
    updateData.curriculum = validated.data.curriculum;
  }

  const { data, error } = await client
    .from('courses')
    .update(updateData)
    .eq('id', courseId)
    .select(`
      *,
      instructor:profiles!courses_instructor_id_fkey (
        name
      )
    `)
    .single();

  if (error) {
    return failure(500, coursesErrorCodes.updateError, error.message);
  }

  const parsed = CourseWithInstructorRowSchema.safeParse(data);

  if (!parsed.success) {
    return failure(
      500,
      coursesErrorCodes.validationError,
      'Course response validation failed',
      parsed.error.format(),
    );
  }

  const response = mapCourseToResponse(parsed.data);

  return success(response);
};

/**
 * 코스 상태 전환
 */
export const updateCourseStatus = async (
  client: SupabaseClient,
  courseId: string,
  instructorId: string,
  input: UpdateCourseStatusInput,
): Promise<HandlerResult<CourseResponse, CoursesServiceError, unknown>> => {
  // 1. 코스 존재 및 소유자 확인
  const { data: course } = await client
    .from('courses')
    .select('instructor_id, status')
    .eq('id', courseId)
    .single();

  if (!course) {
    return failure(404, coursesErrorCodes.notFound, 'Course not found');
  }

  if (course.instructor_id !== instructorId) {
    return failure(403, coursesErrorCodes.forbidden, 'Not the course owner');
  }

  // 2. 입력값 검증
  const validated = UpdateCourseStatusSchema.safeParse(input);

  if (!validated.success) {
    return failure(
      400,
      coursesErrorCodes.validationError,
      'Invalid status',
      validated.error.format(),
    );
  }

  // 3. 상태 전환 가능 여부 확인
  if (!isValidTransition(course.status, validated.data.status)) {
    return failure(
      400,
      coursesErrorCodes.invalidTransition,
      `Cannot transition from ${course.status} to ${validated.data.status}`,
    );
  }

  // 4. 상태 업데이트
  const { data, error } = await client
    .from('courses')
    .update({ status: validated.data.status })
    .eq('id', courseId)
    .select(`
      *,
      instructor:profiles!courses_instructor_id_fkey (
        name
      )
    `)
    .single();

  if (error) {
    return failure(500, coursesErrorCodes.updateError, error.message);
  }

  const parsed = CourseWithInstructorRowSchema.safeParse(data);

  if (!parsed.success) {
    return failure(
      500,
      coursesErrorCodes.validationError,
      'Course response validation failed',
      parsed.error.format(),
    );
  }

  const response = mapCourseToResponse(parsed.data);

  return success(response);
};
```

**Unit Tests**:
```typescript
describe('Courses Service', () => {
  describe('createCourse', () => {
    it('should create course with draft status', async () => {
      const result = await createCourse(mockClient, instructorId, {
        title: 'React 기초',
        category: 'Programming',
        difficulty: 'beginner',
      });
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe('draft');
    });

    it('should validate required fields', async () => {
      const result = await createCourse(mockClient, instructorId, {
        title: '',
        category: 'Programming',
        difficulty: 'beginner',
      });
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(coursesErrorCodes.validationError);
    });

    it('should validate category', async () => {
      const result = await createCourse(mockClient, instructorId, {
        title: 'React 기초',
        category: 'InvalidCategory',
        difficulty: 'beginner',
      });
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(coursesErrorCodes.invalidCategory);
    });
  });

  describe('updateCourse', () => {
    it('should update course', async () => {
      const result = await updateCourse(mockClient, courseId, instructorId, {
        title: 'React 심화',
      });
      expect(result.ok).toBe(true);
      expect(result.data.title).toBe('React 심화');
    });

    it('should reject non-owner', async () => {
      const result = await updateCourse(mockClient, courseId, otherInstructorId, {
        title: 'React 심화',
      });
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(coursesErrorCodes.forbidden);
    });
  });

  describe('updateCourseStatus', () => {
    it('should allow draft to published', async () => {
      const result = await updateCourseStatus(mockClient, courseId, instructorId, {
        status: 'published',
      });
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe('published');
    });

    it('should reject invalid transition', async () => {
      // Mock: current status = archived
      const result = await updateCourseStatus(mockClient, courseId, instructorId, {
        status: 'published',
      });
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(coursesErrorCodes.invalidTransition);
    });
  });

  describe('isValidTransition', () => {
    it('should allow draft → published', () => {
      expect(isValidTransition('draft', 'published')).toBe(true);
    });

    it('should allow draft → archived', () => {
      expect(isValidTransition('draft', 'archived')).toBe(true);
    });

    it('should allow published → archived', () => {
      expect(isValidTransition('published', 'archived')).toBe(true);
    });

    it('should reject archived → published', () => {
      expect(isValidTransition('archived', 'published')).toBe(false);
    });
  });
});
```

**의존성**:
- `@supabase/supabase-js`
- `@/backend/http/response`
- `./schema`
- `./error`

---

### 4. Backend: Courses Route (`src/features/courses/backend/route.ts`)

**책임**: Hono 라우트 정의 및 인증/권한 검증

**구현 내용**:
```typescript
import type { Hono } from 'hono';
import { failure, respond, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  createCourse,
  getCourseById,
  updateCourse,
  updateCourseStatus,
} from './service';
import { coursesErrorCodes, type CoursesServiceError } from './error';
import {
  CreateCourseSchema,
  UpdateCourseSchema,
  UpdateCourseStatusSchema,
} from './schema';

export const registerCoursesRoutes = (app: Hono<AppEnv>) => {
  /**
   * POST /api/courses
   * 코스 생성
   */
  app.post('/api/courses', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized access to create course', authError?.message);
      return respond(
        c,
        failure(401, coursesErrorCodes.unauthorized, 'Unauthorized'),
      );
    }

    // 사용자 역할 확인 (Instructor만 허용)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'instructor') {
      logger.warn('Non-instructor create course attempt', { userId: user.id });
      return respond(
        c,
        failure(
          403,
          coursesErrorCodes.forbidden,
          'Only instructors can create courses',
        ),
      );
    }

    // 요청 바디 파싱
    const body = await c.req.json();
    const parsedBody = CreateCourseSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          coursesErrorCodes.validationError,
          'Invalid request body',
          parsedBody.error.format(),
        ),
      );
    }

    const result = await createCourse(supabase, user.id, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<CoursesServiceError, unknown>;
      logger.error('Failed to create course', errorResult.error.message);
      return respond(c, result);
    }

    logger.info('Course created successfully', { userId: user.id, courseId: result.data.id });
    return respond(c, result);
  });

  /**
   * GET /api/courses/:id
   * 코스 조회
   */
  app.get('/api/courses/:id', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const courseId = c.req.param('id');

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized access to course', authError?.message);
      return respond(
        c,
        failure(401, coursesErrorCodes.unauthorized, 'Unauthorized'),
      );
    }

    const result = await getCourseById(supabase, courseId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<CoursesServiceError, unknown>;

      if (errorResult.error.code === coursesErrorCodes.notFound) {
        logger.warn('Course not found', { courseId });
      } else {
        logger.error('Failed to fetch course', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('Course fetched successfully', { courseId });
    return respond(c, result);
  });

  /**
   * PATCH /api/courses/:id
   * 코스 수정
   */
  app.patch('/api/courses/:id', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const courseId = c.req.param('id');

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized access to update course', authError?.message);
      return respond(
        c,
        failure(401, coursesErrorCodes.unauthorized, 'Unauthorized'),
      );
    }

    // 사용자 역할 확인 (Instructor만 허용)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'instructor') {
      logger.warn('Non-instructor update course attempt', { userId: user.id });
      return respond(
        c,
        failure(
          403,
          coursesErrorCodes.forbidden,
          'Only instructors can update courses',
        ),
      );
    }

    // 요청 바디 파싱
    const body = await c.req.json();
    const parsedBody = UpdateCourseSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          coursesErrorCodes.validationError,
          'Invalid request body',
          parsedBody.error.format(),
        ),
      );
    }

    const result = await updateCourse(supabase, courseId, user.id, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<CoursesServiceError, unknown>;
      logger.error('Failed to update course', errorResult.error.message);
      return respond(c, result);
    }

    logger.info('Course updated successfully', { userId: user.id, courseId });
    return respond(c, result);
  });

  /**
   * PATCH /api/courses/:id/status
   * 코스 상태 전환
   */
  app.patch('/api/courses/:id/status', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const courseId = c.req.param('id');

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized access to update course status', authError?.message);
      return respond(
        c,
        failure(401, coursesErrorCodes.unauthorized, 'Unauthorized'),
      );
    }

    // 사용자 역할 확인 (Instructor만 허용)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'instructor') {
      logger.warn('Non-instructor update course status attempt', { userId: user.id });
      return respond(
        c,
        failure(
          403,
          coursesErrorCodes.forbidden,
          'Only instructors can update course status',
        ),
      );
    }

    // 요청 바디 파싱
    const body = await c.req.json();
    const parsedBody = UpdateCourseStatusSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          coursesErrorCodes.validationError,
          'Invalid request body',
          parsedBody.error.format(),
        ),
      );
    }

    const result = await updateCourseStatus(supabase, courseId, user.id, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<CoursesServiceError, unknown>;
      logger.error('Failed to update course status', errorResult.error.message);
      return respond(c, result);
    }

    logger.info('Course status updated successfully', { userId: user.id, courseId });
    return respond(c, result);
  });
};
```

**의존성**:
- `hono`
- `@/backend/http/response`
- `@/backend/hono/context`
- `./service`
- `./error`
- `./schema`

---

### 5. Hono App Integration

**파일**: `src/backend/hono/app.ts`

**수정 내용**:
```typescript
import { registerCoursesRoutes } from '@/features/courses/backend/route';

export const createHonoApp = () => {
  // ... 기존 코드 ...

  // 라우트 등록
  registerExampleRoutes(app);
  registerGradesRoutes(app);
  registerInstructorDashboardRoutes(app);
  registerCoursesRoutes(app); // 추가

  return app;
};
```

---

### 6. Frontend: Course DTO (`src/features/courses/lib/dto.ts`)

**책임**: Backend 스키마 재노출

**구현 내용**:
```typescript
export {
  CreateCourseSchema,
  UpdateCourseSchema,
  UpdateCourseStatusSchema,
  CourseResponseSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
  type UpdateCourseStatusInput,
  type CourseResponse,
} from '@/features/courses/backend/schema';
```

---

### 7. Frontend: Course Query Hook (`src/features/courses/hooks/useCourseQuery.ts`)

**책임**: React Query 기반 코스 조회

**구현 내용**:
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { CourseResponseSchema } from '@/features/courses/lib/dto';

const fetchCourse = async (courseId: string) => {
  try {
    const { data } = await apiClient.get(`/api/courses/${courseId}`);
    return CourseResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch course.');
    throw new Error(message);
  }
};

export const useCourseQuery = (courseId: string) =>
  useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => fetchCourse(courseId),
    enabled: Boolean(courseId),
    staleTime: 60 * 1000, // 1분
    retry: 2,
  });
```

**의존성**:
- `@tanstack/react-query`
- `@/lib/remote/api-client`
- `@/features/courses/lib/dto`

---

### 8. Frontend: Course Mutations Hook (`src/features/courses/hooks/useCourseMutations.ts`)

**책임**: React Query 기반 코스 생성/수정/상태전환 Mutation

**구현 내용**:
```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  CreateCourseSchema,
  UpdateCourseSchema,
  UpdateCourseStatusSchema,
  CourseResponseSchema,
  type CreateCourseInput,
  type UpdateCourseInput,
  type UpdateCourseStatusInput,
} from '@/features/courses/lib/dto';

const createCourse = async (input: CreateCourseInput) => {
  try {
    const validated = CreateCourseSchema.parse(input);
    const { data } = await apiClient.post('/api/courses', validated);
    return CourseResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to create course.');
    throw new Error(message);
  }
};

const updateCourse = async (courseId: string, input: UpdateCourseInput) => {
  try {
    const validated = UpdateCourseSchema.parse(input);
    const { data } = await apiClient.patch(`/api/courses/${courseId}`, validated);
    return CourseResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to update course.');
    throw new Error(message);
  }
};

const updateCourseStatus = async (
  courseId: string,
  input: UpdateCourseStatusInput,
) => {
  try {
    const validated = UpdateCourseStatusSchema.parse(input);
    const { data } = await apiClient.patch(`/api/courses/${courseId}/status`, validated);
    return CourseResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to update course status.');
    throw new Error(message);
  }
};

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      // Instructor 대시보드 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
    },
  });
};

export const useUpdateCourseMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCourseInput) => updateCourse(courseId, input),
    onSuccess: (data) => {
      // 해당 코스 캐시 업데이트
      queryClient.setQueryData(['courses', courseId], data);
      // Instructor 대시보드 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
    },
  });
};

export const useUpdateCourseStatusMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateCourseStatusInput) => updateCourseStatus(courseId, input),
    onSuccess: (data) => {
      // 해당 코스 캐시 업데이트
      queryClient.setQueryData(['courses', courseId], data);
      // Instructor 대시보드 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
    },
  });
};
```

**의존성**:
- `@tanstack/react-query`
- `@/lib/remote/api-client`
- `@/features/courses/lib/dto`

---

### 9. Frontend: Components

#### 9.1. Course Form (`src/features/courses/components/course-form.tsx`)

**책임**: 코스 생성/수정 폼 표시

**구현 내용**:
```typescript
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { CourseResponse, CreateCourseInput, UpdateCourseInput } from '@/features/courses/lib/dto';

type Props = {
  mode: 'create' | 'edit';
  initialData?: CourseResponse;
  onSubmit: (data: CreateCourseInput | UpdateCourseInput) => Promise<void>;
  isSubmitting: boolean;
};

const categories = ['Programming', 'Design', 'Business', 'Marketing'];
const difficulties = [
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
] as const;

export const CourseForm = ({ mode, initialData, onSubmit, isSubmitting }: Props) => {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState(initialData?.category || '');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>(
    initialData?.difficulty || 'beginner',
  );
  const [curriculum, setCurriculum] = useState(
    initialData?.curriculum ? JSON.stringify(initialData.curriculum, null, 2) : '',
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요';
    } else if (title.length > 200) {
      newErrors.title = '제목은 200자 이하로 입력해주세요';
    }

    if (description.length > 5000) {
      newErrors.description = '소개는 5000자 이하로 입력해주세요';
    }

    if (!category) {
      newErrors.category = '카테고리를 선택해주세요';
    }

    if (curriculum) {
      try {
        JSON.parse(curriculum);
      } catch (e) {
        newErrors.curriculum = '유효한 JSON 형식을 입력해주세요';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const data: CreateCourseInput | UpdateCourseInput = {
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      difficulty,
      curriculum: curriculum ? JSON.parse(curriculum) : undefined,
    };

    try {
      await onSubmit(data);
    } catch (error) {
      // 에러는 부모 컴포넌트에서 처리
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 제목 */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">
          제목 <span className="text-red-600">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="React 기초 강의"
          maxLength={200}
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      {/* 소개 */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium mb-2">
          소개
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="React의 기초를 배우는 강의입니다..."
          rows={5}
          maxLength={5000}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* 카테고리 */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-2">
          카테고리 <span className="text-red-600">*</span>
        </label>
        <select
          id="category"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">선택해주세요</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
      </div>

      {/* 난이도 */}
      <div>
        <label className="block text-sm font-medium mb-2">
          난이도 <span className="text-red-600">*</span>
        </label>
        <div className="flex gap-4">
          {difficulties.map((diff) => (
            <label key={diff.value} className="flex items-center">
              <input
                type="radio"
                value={diff.value}
                checked={difficulty === diff.value}
                onChange={(e) =>
                  setDifficulty(e.target.value as 'beginner' | 'intermediate' | 'advanced')
                }
                className="mr-2"
              />
              {diff.label}
            </label>
          ))}
        </div>
      </div>

      {/* 커리큘럼 */}
      <div>
        <label htmlFor="curriculum" className="block text-sm font-medium mb-2">
          커리큘럼 (JSON)
        </label>
        <textarea
          id="curriculum"
          value={curriculum}
          onChange={(e) => setCurriculum(e.target.value)}
          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          placeholder='{"sections": [{"title": "섹션 1", "order": 1}]}'
          rows={8}
        />
        {errors.curriculum && (
          <p className="mt-1 text-sm text-red-600">{errors.curriculum}</p>
        )}
      </div>

      {/* 버튼 */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          disabled={isSubmitting}
        >
          취소
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? '저장 중...' : mode === 'create' ? '생성하기' : '저장하기'}
        </button>
      </div>
    </form>
  );
};
```

**QA Sheet**:
| 항목 | 확인 사항 |
|------|-----------|
| 필수 필드 검증 | 제목, 카테고리가 비어있을 때 에러 메시지가 표시되는가? |
| 최대 길이 검증 | 제목 200자, 소개 5000자 초과 시 에러 메시지가 표시되는가? |
| JSON 검증 | 커리큘럼에 유효하지 않은 JSON 입력 시 에러 메시지가 표시되는가? |
| 초기값 설정 | 수정 모드일 때 기존 값이 폼에 올바르게 표시되는가? |
| 제출 중 상태 | 제출 중일 때 버튼이 비활성화되고 "저장 중..." 텍스트가 표시되는가? |
| 취소 버튼 | 취소 버튼 클릭 시 이전 페이지로 이동하는가? |
| 레이아웃 | 모든 입력 필드가 올바르게 정렬되고 간격이 적절한가? |

#### 9.2. Course Status Button (`src/features/courses/components/course-status-button.tsx`)

**책임**: 코스 상태 전환 버튼 표시

**구현 내용**:
```typescript
'use client';

import { useState } from 'react';
import type { CourseResponse } from '@/features/courses/lib/dto';

type Props = {
  course: CourseResponse;
  onStatusChange: (status: 'published' | 'archived') => Promise<void>;
  isChanging: boolean;
};

export const CourseStatusButton = ({ course, onStatusChange, isChanging }: Props) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'published' | 'archived' | null>(null);

  const handleClick = (status: 'published' | 'archived') => {
    setTargetStatus(status);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!targetStatus) return;

    try {
      await onStatusChange(targetStatus);
      setShowConfirm(false);
      setTargetStatus(null);
    } catch (error) {
      // 에러는 부모 컴포넌트에서 처리
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setTargetStatus(null);
  };

  const getButtonText = () => {
    if (course.status === 'draft') {
      return '공개하기';
    }
    if (course.status === 'published') {
      return '아카이브하기';
    }
    return null; // archived 상태에서는 버튼 없음
  };

  const getConfirmMessage = () => {
    if (targetStatus === 'published') {
      return '코스를 공개하시겠습니까? 공개 후 학습자들이 수강 신청할 수 있습니다.';
    }
    if (targetStatus === 'archived') {
      return '코스를 아카이브하시겠습니까? 신규 수강 신청이 차단됩니다.';
    }
    return '';
  };

  const buttonText = getButtonText();

  if (!buttonText) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => handleClick(course.status === 'draft' ? 'published' : 'archived')}
        className={`px-4 py-2 rounded-lg font-medium ${
          course.status === 'draft'
            ? 'bg-green-600 text-white hover:bg-green-700'
            : 'bg-yellow-600 text-white hover:bg-yellow-700'
        } disabled:opacity-50`}
        disabled={isChanging}
      >
        {isChanging ? '처리 중...' : buttonText}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold mb-4">확인</h3>
            <p className="text-gray-700 mb-6">{getConfirmMessage()}</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                disabled={isChanging}
              >
                취소
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={isChanging}
              >
                {isChanging ? '처리 중...' : '확인'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
```

**QA Sheet**:
| 항목 | 확인 사항 |
|------|-----------|
| 조건부 렌더링 | draft 상태일 때 "공개하기" 버튼이 표시되는가? |
| 조건부 렌더링 | published 상태일 때 "아카이브하기" 버튼이 표시되는가? |
| 조건부 렌더링 | archived 상태일 때 버튼이 표시되지 않는가? |
| 확인 다이얼로그 | 버튼 클릭 시 확인 다이얼로그가 표시되는가? |
| 확인 메시지 | 각 상태 전환에 맞는 확인 메시지가 표시되는가? |
| 취소 기능 | 확인 다이얼로그에서 취소 버튼 클릭 시 다이얼로그가 닫히는가? |
| 제출 중 상태 | 처리 중일 때 버튼이 비활성화되고 "처리 중..." 텍스트가 표시되는가? |
| 스타일 | draft와 published 상태에 따라 다른 색상이 적용되는가? |

#### 9.3. Course Detail (`src/features/courses/components/course-detail.tsx`)

**책임**: 코스 상세 정보 표시

**구현 내용**:
```typescript
'use client';

import Link from 'next/link';
import type { CourseResponse } from '@/features/courses/lib/dto';
import { format } from 'date-fns';

type Props = {
  course: CourseResponse;
};

const statusLabels = {
  draft: '작성 중',
  published: '공개',
  archived: '아카이브됨',
};

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  archived: 'bg-yellow-100 text-yellow-800',
};

const difficultyLabels = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

export const CourseDetail = ({ course }: Props) => {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-gray-600 mt-2">강사: {course.instructorName}</p>
        </div>
        <span
          className={`text-sm px-3 py-1 rounded ${statusColors[course.status]}`}
        >
          {statusLabels[course.status]}
        </span>
      </div>

      {/* 메타 정보 */}
      <div className="flex items-center gap-4 text-sm">
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">
          {course.category}
        </span>
        <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded">
          {difficultyLabels[course.difficulty]}
        </span>
      </div>

      {/* 소개 */}
      {course.description && (
        <div>
          <h2 className="text-lg font-bold mb-2">소개</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{course.description}</p>
        </div>
      )}

      {/* 커리큘럼 */}
      {course.curriculum && (
        <div>
          <h2 className="text-lg font-bold mb-2">커리큘럼</h2>
          <pre className="bg-gray-50 p-4 rounded-lg overflow-x-auto text-sm">
            {JSON.stringify(course.curriculum, null, 2)}
          </pre>
        </div>
      )}

      {/* 생성/수정 일시 */}
      <div className="border-t pt-4 text-sm text-gray-500">
        <p>생성일: {format(new Date(course.createdAt), 'yyyy-MM-dd HH:mm')}</p>
        <p>수정일: {format(new Date(course.updatedAt), 'yyyy-MM-dd HH:mm')}</p>
      </div>
    </div>
  );
};
```

**QA Sheet**:
| 항목 | 확인 사항 |
|------|-----------|
| 렌더링 | 제목, 강사명, 상태 배지가 올바르게 표시되는가? |
| 메타 정보 | 카테고리, 난이도가 적절한 색상의 배지로 표시되는가? |
| 조건부 렌더링 | 소개가 없을 때 소개 섹션이 표시되지 않는가? |
| 조건부 렌더링 | 커리큘럼이 없을 때 커리큘럼 섹션이 표시되지 않는가? |
| JSON 포맷 | 커리큘럼 JSON이 보기 좋게 포맷되어 표시되는가? |
| 날짜 포맷 | 생성일/수정일이 올바른 형식으로 표시되는가? |
| 스타일 | 레이아웃이 깨지지 않고 간격이 적절한가? |

---

### 10. Frontend: Pages

#### 10.1. Course New Page (`src/app/(protected)/instructor/courses/new/page.tsx`)

**책임**: 코스 생성 페이지

**구현 내용**:
```typescript
'use client';

import { useRouter } from 'next/navigation';
import { CourseForm } from '@/features/courses/components/course-form';
import { useCreateCourseMutation } from '@/features/courses/hooks/useCourseMutations';
import type { CreateCourseInput } from '@/features/courses/lib/dto';

export default function CourseNewPage() {
  const router = useRouter();
  const createMutation = useCreateCourseMutation();

  const handleSubmit = async (data: CreateCourseInput) => {
    try {
      const course = await createMutation.mutateAsync(data);
      alert('코스가 생성되었습니다.');
      router.push(`/instructor/courses/${course.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : '코스 생성에 실패했습니다.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">새 코스 만들기</h1>
      <CourseForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={createMutation.isPending}
      />
    </div>
  );
}
```

**QA Sheet**:
| 항목 | 확인 사항 |
|------|-----------|
| 라우팅 | /instructor/courses/new 경로로 접근 가능한가? |
| 폼 렌더링 | CourseForm이 생성 모드로 렌더링되는가? |
| 제출 성공 | 제출 성공 시 성공 메시지가 표시되고 상세 페이지로 이동하는가? |
| 제출 실패 | 제출 실패 시 에러 메시지가 표시되는가? |
| 로딩 상태 | 제출 중일 때 폼의 로딩 상태가 올바르게 표시되는가? |
| 인증 | 비로그인 사용자는 리다이렉트되는가? |
| 권한 | Learner 역할은 접근 불가능한가? |

#### 10.2. Course Edit Page (`src/app/(protected)/instructor/courses/[id]/edit/page.tsx`)

**책임**: 코스 수정 페이지

**구현 내용**:
```typescript
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { CourseForm } from '@/features/courses/components/course-form';
import { useCourseQuery } from '@/features/courses/hooks/useCourseQuery';
import { useUpdateCourseMutation } from '@/features/courses/hooks/useCourseMutations';
import type { UpdateCourseInput } from '@/features/courses/lib/dto';

type Props = {
  params: Promise<{ id: string }>;
};

export default function CourseEditPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: course, isLoading, error } = useCourseQuery(id);
  const updateMutation = useUpdateCourseMutation(id);

  const handleSubmit = async (data: UpdateCourseInput) => {
    try {
      await updateMutation.mutateAsync(data);
      alert('코스가 수정되었습니다.');
      router.push(`/instructor/courses/${id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : '코스 수정에 실패했습니다.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">코스를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">코스를 불러오는데 실패했습니다.</p>
        <button
          onClick={() => router.push('/instructor/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">코스 수정</h1>
      <CourseForm
        mode="edit"
        initialData={course}
        onSubmit={handleSubmit}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
```

**QA Sheet**:
| 항목 | 확인 사항 |
|------|-----------|
| 라우팅 | /instructor/courses/[id]/edit 경로로 접근 가능한가? |
| 로딩 상태 | 코스 로딩 중일 때 로딩 메시지가 표시되는가? |
| 에러 상태 | 코스 로드 실패 시 에러 메시지와 대시보드 버튼이 표시되는가? |
| 폼 렌더링 | CourseForm이 수정 모드로 기존 값과 함께 렌더링되는가? |
| 제출 성공 | 제출 성공 시 성공 메시지가 표시되고 상세 페이지로 이동하는가? |
| 제출 실패 | 제출 실패 시 에러 메시지가 표시되는가? |
| 권한 | 소유자가 아닌 Instructor는 접근 불가능한가? |

#### 10.3. Course Detail Page (`src/app/(protected)/instructor/courses/[id]/page.tsx`)

**책임**: 코스 상세 페이지

**구현 내용**:
```typescript
'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CourseDetail } from '@/features/courses/components/course-detail';
import { CourseStatusButton } from '@/features/courses/components/course-status-button';
import { useCourseQuery } from '@/features/courses/hooks/useCourseQuery';
import { useUpdateCourseStatusMutation } from '@/features/courses/hooks/useCourseMutations';
import type { UpdateCourseStatusInput } from '@/features/courses/lib/dto';

type Props = {
  params: Promise<{ id: string }>;
};

export default function CourseDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { data: course, isLoading, error } = useCourseQuery(id);
  const statusMutation = useUpdateCourseStatusMutation(id);

  const handleStatusChange = async (status: 'published' | 'archived') => {
    try {
      await statusMutation.mutateAsync({ status });
      alert(
        status === 'published'
          ? '코스가 공개되었습니다.'
          : '코스가 아카이브되었습니다.',
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : '상태 변경에 실패했습니다.');
      throw error;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">코스를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">코스를 불러오는데 실패했습니다.</p>
        <button
          onClick={() => router.push('/instructor/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          대시보드로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* 액션 버튼 */}
      <div className="flex justify-end gap-3 mb-6">
        <Link
          href={`/instructor/courses/${id}/edit`}
          className="px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          수정하기
        </Link>
        <CourseStatusButton
          course={course}
          onStatusChange={handleStatusChange}
          isChanging={statusMutation.isPending}
        />
      </div>

      {/* 코스 상세 */}
      <CourseDetail course={course} />
    </div>
  );
}
```

**QA Sheet**:
| 항목 | 확인 사항 |
|------|-----------|
| 라우팅 | /instructor/courses/[id] 경로로 접근 가능한가? |
| 로딩 상태 | 코스 로딩 중일 때 로딩 메시지가 표시되는가? |
| 에러 상태 | 코스 로드 실패 시 에러 메시지와 대시보드 버튼이 표시되는가? |
| 상세 정보 | CourseDetail이 올바르게 렌더링되는가? |
| 수정 버튼 | 수정 버튼 클릭 시 수정 페이지로 이동하는가? |
| 상태 전환 | CourseStatusButton이 올바르게 동작하는가? |
| 상태 변경 성공 | 상태 변경 성공 시 성공 메시지가 표시되는가? |
| 상태 변경 실패 | 상태 변경 실패 시 에러 메시지가 표시되는가? |

---

## 구현 순서

1. **Backend Schema & Error** 정의
2. **Backend Service** 구현 및 Unit Test 작성
3. **Backend Route** 구현 및 Hono App 통합
4. **Frontend DTO** 작성
5. **Frontend Hooks** 구현 (Query, Mutations)
6. **Frontend Components** 구현 (CourseForm → CourseStatusButton → CourseDetail)
7. **Frontend Pages** 구현 (New → Edit → Detail)
8. **통합 테스트** 수행

---

## 테스트 체크리스트

### Backend
- [ ] 코스 생성 (draft 상태, 필수 필드 검증)
- [ ] 카테고리 유효성 검증
- [ ] 코스 조회 (단일)
- [ ] 코스 수정 (소유자만 가능)
- [ ] 코스 상태 전환 (draft→published, published→archived)
- [ ] 유효하지 않은 상태 전환 차단 (archived→published)
- [ ] DB 에러 처리
- [ ] 인증 실패 처리 (401)
- [ ] 권한 없음 처리 (403, 비소유자/Learner 접근 시)

### Frontend
- [ ] 코스 생성 폼 렌더링 및 제출
- [ ] 코스 수정 폼 렌더링 (기존 값) 및 제출
- [ ] 필수 필드 검증 (제목, 카테고리)
- [ ] JSON 검증 (커리큘럼)
- [ ] 코스 상세 정보 표시
- [ ] 상태 전환 버튼 (draft/published에만 표시)
- [ ] 상태 전환 확인 다이얼로그
- [ ] 로딩 상태 표시
- [ ] 에러 상태 표시
- [ ] 성공 메시지 및 리다이렉트
- [ ] 반응형 레이아웃
