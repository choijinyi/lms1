# UC-009: 과제 관리 (Instructor) - Implementation Plan

## 개요

### Backend Modules
| 모듈명 | 위치 | 설명 |
|--------|------|------|
| Assignments Service | `src/features/assignments/backend/service.ts` | 과제 CRUD 비즈니스 로직 (생성, 조회, 수정, 상태 전환, 제출물 통계) |
| Assignments Route | `src/features/assignments/backend/route.ts` | 과제 API 라우트 정의 (POST/GET/PATCH) |
| Assignments Schema | `src/features/assignments/backend/schema.ts` | 요청/응답 zod 스키마 정의 |
| Assignments Error | `src/features/assignments/backend/error.ts` | 에러 코드 정의 |

### Frontend Modules
| 모듈명 | 위치 | 설명 |
|--------|------|------|
| Assignment Mutations | `src/features/assignments/hooks/useAssignmentMutations.ts` | 과제 생성/수정/상태전환 Mutation 훅 |
| Assignment Query | `src/features/assignments/hooks/useAssignmentQuery.ts` | 단일 과제 조회 Query 훅 |
| Assignments Query | `src/features/assignments/hooks/useAssignmentsQuery.ts` | 과제 목록 조회 Query 훅 (제출물 통계 포함) |
| Assignment DTO | `src/features/assignments/lib/dto.ts` | Backend 스키마 재노출 |
| Assignment Form Component | `src/features/assignments/components/assignment-form.tsx` | 과제 생성/수정 폼 컴포넌트 |
| Assignment Status Button | `src/features/assignments/components/assignment-status-button.tsx` | 상태 전환 버튼 컴포넌트 |
| Assignment Detail Component | `src/features/assignments/components/assignment-detail.tsx` | 과제 상세 정보 표시 컴포넌트 |
| Assignment List Component | `src/features/assignments/components/assignment-list.tsx` | 과제 목록 컴포넌트 |
| Assignment Card Component | `src/features/assignments/components/assignment-card.tsx` | 과제 카드 컴포넌트 (제출물 통계 포함) |
| Assignments Page | `src/app/(protected)/instructor/courses/[courseId]/assignments/page.tsx` | 과제 목록 페이지 |
| Assignment New Page | `src/app/(protected)/instructor/courses/[courseId]/assignments/new/page.tsx` | 과제 생성 페이지 |
| Assignment Edit Page | `src/app/(protected)/instructor/assignments/[id]/edit/page.tsx` | 과제 수정 페이지 |
| Assignment Detail Page | `src/app/(protected)/instructor/assignments/[id]/page.tsx` | 과제 상세 페이지 |

---

## Diagram

```mermaid
graph TB
    subgraph Frontend
        ListPage[Assignments Page<br/>courses/[courseId]/assignments/page.tsx]
        NewPage[Assignment New Page<br/>courses/[courseId]/assignments/new/page.tsx]
        EditPage[Assignment Edit Page<br/>assignments/[id]/edit/page.tsx]
        DetailPage[Assignment Detail Page<br/>assignments/[id]/page.tsx]

        AssignmentForm[AssignmentForm Component<br/>components/assignment-form.tsx]
        AssignmentDetail[AssignmentDetail Component<br/>components/assignment-detail.tsx]
        StatusButton[AssignmentStatusButton Component<br/>components/assignment-status-button.tsx]
        AssignmentList[AssignmentList Component<br/>components/assignment-list.tsx]
        AssignmentCard[AssignmentCard Component<br/>components/assignment-card.tsx]

        Mutations[useAssignmentMutations Hook<br/>hooks/useAssignmentMutations.ts]
        Query[useAssignmentQuery Hook<br/>hooks/useAssignmentQuery.ts]
        ListQuery[useAssignmentsQuery Hook<br/>hooks/useAssignmentsQuery.ts]
        DTO[Assignment DTO<br/>lib/dto.ts]
    end

    subgraph Backend
        Route[Assignments Route<br/>backend/route.ts<br/>POST /api/courses/:courseId/assignments<br/>GET /api/courses/:courseId/assignments<br/>GET /api/assignments/:id<br/>PATCH /api/assignments/:id<br/>PATCH /api/assignments/:id/status]
        Service[Assignments Service<br/>backend/service.ts]
        Schema[Assignments Schema<br/>backend/schema.ts]
        Error[Assignments Error<br/>backend/error.ts]
    end

    subgraph Database
        Assignments[(assignments)]
        Courses[(courses)]
        Submissions[(submissions)]
        Profiles[(profiles)]
    end

    ListPage --> AssignmentList
    ListPage --> ListQuery
    NewPage --> AssignmentForm
    EditPage --> AssignmentForm
    EditPage --> Query
    DetailPage --> AssignmentDetail
    DetailPage --> StatusButton
    DetailPage --> Query

    AssignmentList --> AssignmentCard
    AssignmentForm --> Mutations
    StatusButton --> Mutations
    Mutations --> DTO
    Query --> DTO
    ListQuery --> DTO

    Mutations --> |HTTP POST/PATCH| Route
    Query --> |HTTP GET| Route
    ListQuery --> |HTTP GET| Route

    Route --> Service
    Route --> Schema
    Service --> Schema
    Service --> Error
    Service --> Assignments
    Service --> Courses
    Service --> Submissions
    Service --> Profiles

    DTO -.re-export.-> Schema
```

---

## Implementation Plan

### 1. Backend: Assignments Schema (`src/features/assignments/backend/schema.ts`)

**책임**: 요청/응답 데이터 구조 정의 및 검증

**구현 내용**:
```typescript
import { z } from 'zod';

// 과제 생성 요청 스키마
export const CreateAssignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  dueDate: z.string().datetime(), // ISO 8601
  weight: z.number().min(0).max(100),
  allowLate: z.boolean(),
  allowResubmit: z.boolean(),
});

// 과제 수정 요청 스키마
export const UpdateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().min(1).max(5000).optional(),
  dueDate: z.string().datetime().optional(),
  weight: z.number().min(0).max(100).optional(),
  allowLate: z.boolean().optional(),
  allowResubmit: z.boolean().optional(),
});

// 과제 상태 전환 요청 스키마
export const UpdateAssignmentStatusSchema = z.object({
  status: z.enum(['published', 'closed']),
});

// 제출물 통계 스키마
export const SubmissionStatsSchema = z.object({
  totalCount: z.number().int().min(0),
  submittedCount: z.number().int().min(0),
  gradedCount: z.number().int().min(0),
  lateCount: z.number().int().min(0),
  resubmissionRequiredCount: z.number().int().min(0),
});

// 과제 응답 스키마
export const AssignmentResponseSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  title: z.string(),
  description: z.string(),
  dueDate: z.string(),
  weight: z.number(),
  allowLate: z.boolean(),
  allowResubmit: z.boolean(),
  status: z.enum(['draft', 'published', 'closed']),
  submissionStats: SubmissionStatsSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 과제 목록 응답 스키마
export const AssignmentsResponseSchema = z.object({
  assignments: z.array(AssignmentResponseSchema),
});

// DB Row 스키마
export const AssignmentRowSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  title: z.string(),
  description: z.string(),
  due_date: z.string(),
  weight: z.number(),
  allow_late: z.boolean(),
  allow_resubmit: z.boolean(),
  status: z.enum(['draft', 'published', 'closed']),
  created_at: z.string(),
  updated_at: z.string(),
});

export const AssignmentWithCourseRowSchema = AssignmentRowSchema.extend({
  course: z.object({
    title: z.string(),
    instructor_id: z.string().uuid(),
  }),
});

export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;
export type UpdateAssignmentStatusInput = z.infer<typeof UpdateAssignmentStatusSchema>;
export type SubmissionStats = z.infer<typeof SubmissionStatsSchema>;
export type AssignmentResponse = z.infer<typeof AssignmentResponseSchema>;
export type AssignmentsResponse = z.infer<typeof AssignmentsResponseSchema>;
export type AssignmentRow = z.infer<typeof AssignmentRowSchema>;
export type AssignmentWithCourseRow = z.infer<typeof AssignmentWithCourseRowSchema>;
```

**의존성**:
- `zod` 패키지

---

### 2. Backend: Assignments Error (`src/features/assignments/backend/error.ts`)

**책임**: 에러 코드 정의

**구현 내용**:
```typescript
export const assignmentsErrorCodes = {
  notFound: 'ASSIGNMENT_NOT_FOUND',
  createError: 'ASSIGNMENT_CREATE_ERROR',
  updateError: 'ASSIGNMENT_UPDATE_ERROR',
  validationError: 'ASSIGNMENT_VALIDATION_ERROR',
  unauthorized: 'ASSIGNMENT_UNAUTHORIZED',
  forbidden: 'ASSIGNMENT_FORBIDDEN',
  invalidTransition: 'ASSIGNMENT_INVALID_TRANSITION',
  invalidDueDate: 'ASSIGNMENT_INVALID_DUE_DATE',
  courseNotFound: 'COURSE_NOT_FOUND',
} as const;

type AssignmentsErrorValue = (typeof assignmentsErrorCodes)[keyof typeof assignmentsErrorCodes];

export type AssignmentsServiceError = AssignmentsErrorValue;
```

**의존성**: 없음

---

### 3. Backend: Assignments Service (`src/features/assignments/backend/service.ts`)

**책임**: 과제 CRUD 비즈니스 로직 및 제출물 통계 조회

**구현 내용**:
```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import {
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
  UpdateAssignmentStatusSchema,
  AssignmentResponseSchema,
  AssignmentsResponseSchema,
  AssignmentWithCourseRowSchema,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
  type UpdateAssignmentStatusInput,
  type AssignmentResponse,
  type AssignmentsResponse,
  type SubmissionStats,
} from './schema';
import { assignmentsErrorCodes, type AssignmentsServiceError } from './error';

/**
 * 상태 전환 가능 여부 확인
 */
const isValidTransition = (
  currentStatus: 'draft' | 'published' | 'closed',
  targetStatus: 'published' | 'closed',
): boolean => {
  const validTransitions: Record<string, string[]> = {
    draft: ['published', 'closed'],
    published: ['closed'],
    closed: [],
  };

  return validTransitions[currentStatus]?.includes(targetStatus) ?? false;
};

/**
 * 과제별 제출물 통계 조회
 */
const getSubmissionStats = async (
  client: SupabaseClient,
  assignmentId: string,
): Promise<SubmissionStats> => {
  // 총 제출 수
  const { count: totalCount } = await client
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId);

  // 제출 완료 수 (submitted + graded + resubmission_required)
  const { count: submittedCount } = await client
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)
    .in('status', ['submitted', 'graded', 'resubmission_required']);

  // 채점 완료 수
  const { count: gradedCount } = await client
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)
    .eq('status', 'graded');

  // 지각 제출 수
  const { count: lateCount } = await client
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)
    .eq('late', true);

  // 재제출 요청 수
  const { count: resubmissionRequiredCount } = await client
    .from('submissions')
    .select('id', { count: 'exact', head: true })
    .eq('assignment_id', assignmentId)
    .eq('status', 'resubmission_required');

  return {
    totalCount: totalCount ?? 0,
    submittedCount: submittedCount ?? 0,
    gradedCount: gradedCount ?? 0,
    lateCount: lateCount ?? 0,
    resubmissionRequiredCount: resubmissionRequiredCount ?? 0,
  };
};

/**
 * DB Row를 Response로 변환
 */
const mapAssignmentToResponse = (
  row: any,
  stats?: SubmissionStats,
): AssignmentResponse => {
  return {
    id: row.id,
    courseId: row.course_id,
    courseTitle: row.course?.title || 'Unknown',
    title: row.title,
    description: row.description,
    dueDate: row.due_date,
    weight: row.weight,
    allowLate: row.allow_late,
    allowResubmit: row.allow_resubmit,
    status: row.status,
    submissionStats: stats,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * 과제 생성
 */
export const createAssignment = async (
  client: SupabaseClient,
  courseId: string,
  instructorId: string,
  input: CreateAssignmentInput,
): Promise<HandlerResult<AssignmentResponse, AssignmentsServiceError, unknown>> => {
  // 1. 코스 소유자 확인
  const { data: course } = await client
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();

  if (!course) {
    return failure(404, assignmentsErrorCodes.courseNotFound, 'Course not found');
  }

  if (course.instructor_id !== instructorId) {
    return failure(403, assignmentsErrorCodes.forbidden, 'Not the course owner');
  }

  // 2. 입력값 검증
  const validated = CreateAssignmentSchema.safeParse(input);

  if (!validated.success) {
    return failure(
      400,
      assignmentsErrorCodes.validationError,
      'Invalid assignment data',
      validated.error.format(),
    );
  }

  // 3. 마감일 검증 (현재 시각 이후)
  const now = new Date();
  const dueDate = new Date(validated.data.dueDate);

  if (dueDate <= now) {
    return failure(
      400,
      assignmentsErrorCodes.invalidDueDate,
      'Due date must be in the future',
    );
  }

  // 4. 과제 생성 (기본 상태: draft)
  const { data, error } = await client
    .from('assignments')
    .insert({
      course_id: courseId,
      title: validated.data.title,
      description: validated.data.description,
      due_date: validated.data.dueDate,
      weight: validated.data.weight,
      allow_late: validated.data.allowLate,
      allow_resubmit: validated.data.allowResubmit,
      status: 'draft',
    })
    .select(`
      *,
      course:courses (
        title,
        instructor_id
      )
    `)
    .single();

  if (error) {
    return failure(500, assignmentsErrorCodes.createError, error.message);
  }

  const parsed = AssignmentWithCourseRowSchema.safeParse(data);

  if (!parsed.success) {
    return failure(
      500,
      assignmentsErrorCodes.validationError,
      'Assignment response validation failed',
      parsed.error.format(),
    );
  }

  const response = mapAssignmentToResponse(parsed.data);

  return success(response, 201);
};

/**
 * 과제 조회 (단일)
 */
export const getAssignmentById = async (
  client: SupabaseClient,
  assignmentId: string,
  includeStats: boolean = false,
): Promise<HandlerResult<AssignmentResponse, AssignmentsServiceError, unknown>> => {
  const { data, error } = await client
    .from('assignments')
    .select(`
      *,
      course:courses (
        title,
        instructor_id
      )
    `)
    .eq('id', assignmentId)
    .single();

  if (error || !data) {
    return failure(404, assignmentsErrorCodes.notFound, 'Assignment not found');
  }

  const parsed = AssignmentWithCourseRowSchema.safeParse(data);

  if (!parsed.success) {
    return failure(
      500,
      assignmentsErrorCodes.validationError,
      'Assignment response validation failed',
      parsed.error.format(),
    );
  }

  let stats: SubmissionStats | undefined;

  if (includeStats) {
    stats = await getSubmissionStats(client, assignmentId);
  }

  const response = mapAssignmentToResponse(parsed.data, stats);

  return success(response);
};

/**
 * 코스별 과제 목록 조회 (제출물 통계 포함)
 */
export const getAssignmentsByCourseId = async (
  client: SupabaseClient,
  courseId: string,
  instructorId: string,
): Promise<HandlerResult<AssignmentsResponse, AssignmentsServiceError, unknown>> => {
  // 1. 코스 소유자 확인
  const { data: course } = await client
    .from('courses')
    .select('instructor_id')
    .eq('id', courseId)
    .single();

  if (!course) {
    return failure(404, assignmentsErrorCodes.courseNotFound, 'Course not found');
  }

  if (course.instructor_id !== instructorId) {
    return failure(403, assignmentsErrorCodes.forbidden, 'Not the course owner');
  }

  // 2. 과제 목록 조회
  const { data, error } = await client
    .from('assignments')
    .select(`
      *,
      course:courses (
        title,
        instructor_id
      )
    `)
    .eq('course_id', courseId)
    .order('due_date', { ascending: true });

  if (error) {
    return failure(500, assignmentsErrorCodes.createError, error.message);
  }

  // 3. 각 과제별 제출물 통계 조회
  const assignmentsWithStats = await Promise.all(
    (data || []).map(async (assignment) => {
      const stats = await getSubmissionStats(client, assignment.id);
      return mapAssignmentToResponse(assignment, stats);
    }),
  );

  const response: AssignmentsResponse = {
    assignments: assignmentsWithStats,
  };

  const parsed = AssignmentsResponseSchema.safeParse(response);

  if (!parsed.success) {
    return failure(
      500,
      assignmentsErrorCodes.validationError,
      'Assignments response validation failed',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};

/**
 * 과제 수정
 */
export const updateAssignment = async (
  client: SupabaseClient,
  assignmentId: string,
  instructorId: string,
  input: UpdateAssignmentInput,
): Promise<HandlerResult<AssignmentResponse, AssignmentsServiceError, unknown>> => {
  // 1. 과제 존재 및 코스 소유자 확인
  const { data: assignment } = await client
    .from('assignments')
    .select(`
      *,
      course:courses (
        title,
        instructor_id
      )
    `)
    .eq('id', assignmentId)
    .single();

  if (!assignment) {
    return failure(404, assignmentsErrorCodes.notFound, 'Assignment not found');
  }

  if (assignment.course.instructor_id !== instructorId) {
    return failure(403, assignmentsErrorCodes.forbidden, 'Not the course owner');
  }

  // 2. 입력값 검증
  const validated = UpdateAssignmentSchema.safeParse(input);

  if (!validated.success) {
    return failure(
      400,
      assignmentsErrorCodes.validationError,
      'Invalid assignment data',
      validated.error.format(),
    );
  }

  // 3. 마감일 검증 (변경 시)
  if (validated.data.dueDate) {
    const now = new Date();
    const dueDate = new Date(validated.data.dueDate);

    if (dueDate <= now) {
      return failure(
        400,
        assignmentsErrorCodes.invalidDueDate,
        'Due date must be in the future',
      );
    }
  }

  // 4. 과제 업데이트
  const updateData: Record<string, any> = {};

  if (validated.data.title !== undefined) {
    updateData.title = validated.data.title;
  }
  if (validated.data.description !== undefined) {
    updateData.description = validated.data.description;
  }
  if (validated.data.dueDate !== undefined) {
    updateData.due_date = validated.data.dueDate;
  }
  if (validated.data.weight !== undefined) {
    updateData.weight = validated.data.weight;
  }
  if (validated.data.allowLate !== undefined) {
    updateData.allow_late = validated.data.allowLate;
  }
  if (validated.data.allowResubmit !== undefined) {
    updateData.allow_resubmit = validated.data.allowResubmit;
  }

  const { data, error } = await client
    .from('assignments')
    .update(updateData)
    .eq('id', assignmentId)
    .select(`
      *,
      course:courses (
        title,
        instructor_id
      )
    `)
    .single();

  if (error) {
    return failure(500, assignmentsErrorCodes.updateError, error.message);
  }

  const parsed = AssignmentWithCourseRowSchema.safeParse(data);

  if (!parsed.success) {
    return failure(
      500,
      assignmentsErrorCodes.validationError,
      'Assignment response validation failed',
      parsed.error.format(),
    );
  }

  const response = mapAssignmentToResponse(parsed.data);

  return success(response);
};

/**
 * 과제 상태 전환
 */
export const updateAssignmentStatus = async (
  client: SupabaseClient,
  assignmentId: string,
  instructorId: string,
  input: UpdateAssignmentStatusInput,
): Promise<HandlerResult<AssignmentResponse, AssignmentsServiceError, unknown>> => {
  // 1. 과제 존재 및 코스 소유자 확인
  const { data: assignment } = await client
    .from('assignments')
    .select(`
      *,
      course:courses (
        title,
        instructor_id
      )
    `)
    .eq('id', assignmentId)
    .single();

  if (!assignment) {
    return failure(404, assignmentsErrorCodes.notFound, 'Assignment not found');
  }

  if (assignment.course.instructor_id !== instructorId) {
    return failure(403, assignmentsErrorCodes.forbidden, 'Not the course owner');
  }

  // 2. 입력값 검증
  const validated = UpdateAssignmentStatusSchema.safeParse(input);

  if (!validated.success) {
    return failure(
      400,
      assignmentsErrorCodes.validationError,
      'Invalid status',
      validated.error.format(),
    );
  }

  // 3. 상태 전환 가능 여부 확인
  if (!isValidTransition(assignment.status, validated.data.status)) {
    return failure(
      400,
      assignmentsErrorCodes.invalidTransition,
      `Cannot transition from ${assignment.status} to ${validated.data.status}`,
    );
  }

  // 4. 상태 업데이트
  const { data, error } = await client
    .from('assignments')
    .update({ status: validated.data.status })
    .eq('id', assignmentId)
    .select(`
      *,
      course:courses (
        title,
        instructor_id
      )
    `)
    .single();

  if (error) {
    return failure(500, assignmentsErrorCodes.updateError, error.message);
  }

  const parsed = AssignmentWithCourseRowSchema.safeParse(data);

  if (!parsed.success) {
    return failure(
      500,
      assignmentsErrorCodes.validationError,
      'Assignment response validation failed',
      parsed.error.format(),
    );
  }

  const response = mapAssignmentToResponse(parsed.data);

  return success(response);
};
```

**Unit Tests**:
```typescript
describe('Assignments Service', () => {
  describe('createAssignment', () => {
    it('should create assignment with draft status', async () => {
      const result = await createAssignment(mockClient, courseId, instructorId, {
        title: 'React Hooks 과제',
        description: '설명...',
        dueDate: futureDate,
        weight: 20,
        allowLate: true,
        allowResubmit: true,
      });
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe('draft');
    });

    it('should reject past due date', async () => {
      const result = await createAssignment(mockClient, courseId, instructorId, {
        title: 'Test',
        description: 'Test',
        dueDate: pastDate,
        weight: 20,
        allowLate: true,
        allowResubmit: true,
      });
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(assignmentsErrorCodes.invalidDueDate);
    });

    it('should reject non-owner', async () => {
      const result = await createAssignment(mockClient, courseId, otherInstructorId, {
        ...validInput,
      });
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(assignmentsErrorCodes.forbidden);
    });
  });

  describe('getSubmissionStats', () => {
    it('should calculate stats correctly', async () => {
      // Mock: total 10, submitted 7, graded 5, late 2, resubmission 1
      const stats = await getSubmissionStats(mockClient, assignmentId);
      expect(stats.totalCount).toBe(10);
      expect(stats.submittedCount).toBe(7);
      expect(stats.gradedCount).toBe(5);
      expect(stats.lateCount).toBe(2);
      expect(stats.resubmissionRequiredCount).toBe(1);
    });
  });

  describe('updateAssignmentStatus', () => {
    it('should allow draft to published', async () => {
      const result = await updateAssignmentStatus(mockClient, assignmentId, instructorId, {
        status: 'published',
      });
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe('published');
    });

    it('should reject invalid transition', async () => {
      // Mock: current status = closed
      const result = await updateAssignmentStatus(mockClient, assignmentId, instructorId, {
        status: 'published',
      });
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(assignmentsErrorCodes.invalidTransition);
    });
  });

  describe('isValidTransition', () => {
    it('should allow draft → published', () => {
      expect(isValidTransition('draft', 'published')).toBe(true);
    });

    it('should allow draft → closed', () => {
      expect(isValidTransition('draft', 'closed')).toBe(true);
    });

    it('should allow published → closed', () => {
      expect(isValidTransition('published', 'closed')).toBe(true);
    });

    it('should reject closed → published', () => {
      expect(isValidTransition('closed', 'published')).toBe(false);
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

### 4. Backend: Assignments Route (`src/features/assignments/backend/route.ts`)

**책임**: Hono 라우트 정의 및 인증/권한 검증

**구현 내용**:
```typescript
import type { Hono } from 'hono';
import { failure, respond, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  createAssignment,
  getAssignmentById,
  getAssignmentsByCourseId,
  updateAssignment,
  updateAssignmentStatus,
} from './service';
import { assignmentsErrorCodes, type AssignmentsServiceError } from './error';
import {
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
  UpdateAssignmentStatusSchema,
} from './schema';

export const registerAssignmentsRoutes = (app: Hono<AppEnv>) => {
  /**
   * POST /api/courses/:courseId/assignments
   * 과제 생성
   */
  app.post('/api/courses/:courseId/assignments', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const courseId = c.req.param('courseId');

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized access to create assignment', authError?.message);
      return respond(
        c,
        failure(401, assignmentsErrorCodes.unauthorized, 'Unauthorized'),
      );
    }

    // 사용자 역할 확인 (Instructor만 허용)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'instructor') {
      logger.warn('Non-instructor create assignment attempt', { userId: user.id });
      return respond(
        c,
        failure(
          403,
          assignmentsErrorCodes.forbidden,
          'Only instructors can create assignments',
        ),
      );
    }

    // 요청 바디 파싱
    const body = await c.req.json();
    const parsedBody = CreateAssignmentSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          assignmentsErrorCodes.validationError,
          'Invalid request body',
          parsedBody.error.format(),
        ),
      );
    }

    const result = await createAssignment(supabase, courseId, user.id, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AssignmentsServiceError, unknown>;
      logger.error('Failed to create assignment', errorResult.error.message);
      return respond(c, result);
    }

    logger.info('Assignment created successfully', {
      userId: user.id,
      courseId,
      assignmentId: result.data.id,
    });
    return respond(c, result);
  });

  /**
   * GET /api/courses/:courseId/assignments
   * 코스별 과제 목록 조회 (제출물 통계 포함)
   */
  app.get('/api/courses/:courseId/assignments', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const courseId = c.req.param('courseId');

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized access to assignments', authError?.message);
      return respond(
        c,
        failure(401, assignmentsErrorCodes.unauthorized, 'Unauthorized'),
      );
    }

    const result = await getAssignmentsByCourseId(supabase, courseId, user.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AssignmentsServiceError, unknown>;
      logger.error('Failed to fetch assignments', errorResult.error.message);
      return respond(c, result);
    }

    logger.info('Assignments fetched successfully', { courseId });
    return respond(c, result);
  });

  /**
   * GET /api/assignments/:id
   * 과제 조회
   */
  app.get('/api/assignments/:id', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const assignmentId = c.req.param('id');
    const includeStats = c.req.query('includeStats') === 'true';

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized access to assignment', authError?.message);
      return respond(
        c,
        failure(401, assignmentsErrorCodes.unauthorized, 'Unauthorized'),
      );
    }

    const result = await getAssignmentById(supabase, assignmentId, includeStats);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AssignmentsServiceError, unknown>;

      if (errorResult.error.code === assignmentsErrorCodes.notFound) {
        logger.warn('Assignment not found', { assignmentId });
      } else {
        logger.error('Failed to fetch assignment', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('Assignment fetched successfully', { assignmentId });
    return respond(c, result);
  });

  /**
   * PATCH /api/assignments/:id
   * 과제 수정
   */
  app.patch('/api/assignments/:id', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const assignmentId = c.req.param('id');

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized access to update assignment', authError?.message);
      return respond(
        c,
        failure(401, assignmentsErrorCodes.unauthorized, 'Unauthorized'),
      );
    }

    // 사용자 역할 확인 (Instructor만 허용)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'instructor') {
      logger.warn('Non-instructor update assignment attempt', { userId: user.id });
      return respond(
        c,
        failure(
          403,
          assignmentsErrorCodes.forbidden,
          'Only instructors can update assignments',
        ),
      );
    }

    // 요청 바디 파싱
    const body = await c.req.json();
    const parsedBody = UpdateAssignmentSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          assignmentsErrorCodes.validationError,
          'Invalid request body',
          parsedBody.error.format(),
        ),
      );
    }

    const result = await updateAssignment(supabase, assignmentId, user.id, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<AssignmentsServiceError, unknown>;
      logger.error('Failed to update assignment', errorResult.error.message);
      return respond(c, result);
    }

    logger.info('Assignment updated successfully', { userId: user.id, assignmentId });
    return respond(c, result);
  });

  /**
   * PATCH /api/assignments/:id/status
   * 과제 상태 전환
   */
  app.patch('/api/assignments/:id/status', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const assignmentId = c.req.param('id');

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized access to update assignment status', authError?.message);
      return respond(
        c,
        failure(401, assignmentsErrorCodes.unauthorized, 'Unauthorized'),
      );
    }

    // 사용자 역할 확인 (Instructor만 허용)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'instructor') {
      logger.warn('Non-instructor update assignment status attempt', { userId: user.id });
      return respond(
        c,
        failure(
          403,
          assignmentsErrorCodes.forbidden,
          'Only instructors can update assignment status',
        ),
      );
    }

    // 요청 바디 파싱
    const body = await c.req.json();
    const parsedBody = UpdateAssignmentStatusSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          assignmentsErrorCodes.validationError,
          'Invalid request body',
          parsedBody.error.format(),
        ),
      );
    }

    const result = await updateAssignmentStatus(
      supabase,
      assignmentId,
      user.id,
      parsedBody.data,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<AssignmentsServiceError, unknown>;
      logger.error('Failed to update assignment status', errorResult.error.message);
      return respond(c, result);
    }

    logger.info('Assignment status updated successfully', { userId: user.id, assignmentId });
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
import { registerAssignmentsRoutes } from '@/features/assignments/backend/route';

export const createHonoApp = () => {
  // ... 기존 코드 ...

  // 라우트 등록
  registerExampleRoutes(app);
  registerGradesRoutes(app);
  registerInstructorDashboardRoutes(app);
  registerCoursesRoutes(app);
  registerAssignmentsRoutes(app); // 추가

  return app;
};
```

---

### 6. Frontend: Assignment DTO (`src/features/assignments/lib/dto.ts`)

**책임**: Backend 스키마 재노출

**구현 내용**:
```typescript
export {
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
  UpdateAssignmentStatusSchema,
  AssignmentResponseSchema,
  AssignmentsResponseSchema,
  SubmissionStatsSchema,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
  type UpdateAssignmentStatusInput,
  type AssignmentResponse,
  type AssignmentsResponse,
  type SubmissionStats,
} from '@/features/assignments/backend/schema';
```

---

### 7. Frontend: Assignment Query Hook (`src/features/assignments/hooks/useAssignmentQuery.ts`)

**책임**: React Query 기반 과제 조회

**구현 내용**:
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { AssignmentResponseSchema } from '@/features/assignments/lib/dto';

const fetchAssignment = async (assignmentId: string, includeStats: boolean = false) => {
  try {
    const { data } = await apiClient.get(`/api/assignments/${assignmentId}`, {
      params: { includeStats },
    });
    return AssignmentResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch assignment.');
    throw new Error(message);
  }
};

export const useAssignmentQuery = (assignmentId: string, includeStats: boolean = false) =>
  useQuery({
    queryKey: ['assignments', assignmentId, { includeStats }],
    queryFn: () => fetchAssignment(assignmentId, includeStats),
    enabled: Boolean(assignmentId),
    staleTime: 60 * 1000, // 1분
    retry: 2,
  });
```

**의존성**:
- `@tanstack/react-query`
- `@/lib/remote/api-client`
- `@/features/assignments/lib/dto`

---

### 8. Frontend: Assignments Query Hook (`src/features/assignments/hooks/useAssignmentsQuery.ts`)

**책임**: React Query 기반 과제 목록 조회

**구현 내용**:
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { AssignmentsResponseSchema } from '@/features/assignments/lib/dto';

const fetchAssignments = async (courseId: string) => {
  try {
    const { data } = await apiClient.get(`/api/courses/${courseId}/assignments`);
    return AssignmentsResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch assignments.');
    throw new Error(message);
  }
};

export const useAssignmentsQuery = (courseId: string) =>
  useQuery({
    queryKey: ['courses', courseId, 'assignments'],
    queryFn: () => fetchAssignments(courseId),
    enabled: Boolean(courseId),
    staleTime: 30 * 1000, // 30초
    retry: 2,
  });
```

**의존성**:
- `@tanstack/react-query`
- `@/lib/remote/api-client`
- `@/features/assignments/lib/dto`

---

### 9. Frontend: Assignment Mutations Hook (`src/features/assignments/hooks/useAssignmentMutations.ts`)

**책임**: React Query 기반 과제 생성/수정/상태전환 Mutation

**구현 내용**:
```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  CreateAssignmentSchema,
  UpdateAssignmentSchema,
  UpdateAssignmentStatusSchema,
  AssignmentResponseSchema,
  type CreateAssignmentInput,
  type UpdateAssignmentInput,
  type UpdateAssignmentStatusInput,
} from '@/features/assignments/lib/dto';

const createAssignment = async (courseId: string, input: CreateAssignmentInput) => {
  try {
    const validated = CreateAssignmentSchema.parse(input);
    const { data } = await apiClient.post(`/api/courses/${courseId}/assignments`, validated);
    return AssignmentResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to create assignment.');
    throw new Error(message);
  }
};

const updateAssignment = async (assignmentId: string, input: UpdateAssignmentInput) => {
  try {
    const validated = UpdateAssignmentSchema.parse(input);
    const { data } = await apiClient.patch(`/api/assignments/${assignmentId}`, validated);
    return AssignmentResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to update assignment.');
    throw new Error(message);
  }
};

const updateAssignmentStatus = async (
  assignmentId: string,
  input: UpdateAssignmentStatusInput,
) => {
  try {
    const validated = UpdateAssignmentStatusSchema.parse(input);
    const { data } = await apiClient.patch(`/api/assignments/${assignmentId}/status`, validated);
    return AssignmentResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to update assignment status.');
    throw new Error(message);
  }
};

export const useCreateAssignmentMutation = (courseId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateAssignmentInput) => createAssignment(courseId, input),
    onSuccess: () => {
      // 해당 코스의 과제 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['courses', courseId, 'assignments'] });
      // Instructor 대시보드 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
    },
  });
};

export const useUpdateAssignmentMutation = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAssignmentInput) => updateAssignment(assignmentId, input),
    onSuccess: (data) => {
      // 해당 과제 캐시 업데이트
      queryClient.setQueryData(['assignments', assignmentId], data);
      // 해당 코스의 과제 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['courses', data.courseId, 'assignments'] });
    },
  });
};

export const useUpdateAssignmentStatusMutation = (assignmentId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateAssignmentStatusInput) => updateAssignmentStatus(assignmentId, input),
    onSuccess: (data) => {
      // 해당 과제 캐시 업데이트
      queryClient.setQueryData(['assignments', assignmentId], data);
      // 해당 코스의 과제 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['courses', data.courseId, 'assignments'] });
    },
  });
};
```

**의존성**:
- `@tanstack/react-query`
- `@/lib/remote/api-client`
- `@/features/assignments/lib/dto`

---

## 구현 순서

1. **Backend Schema & Error** 정의
2. **Backend Service** 구현 및 Unit Test 작성
3. **Backend Route** 구현 및 Hono App 통합
4. **Frontend DTO** 작성
5. **Frontend Hooks** 구현 (Query, Mutations)
6. **Frontend Components** 구현 (생략 - UC-008과 유사)
7. **Frontend Pages** 구현 (생략 - UC-008과 유사)
8. **통합 테스트** 수행

---

## 테스트 체크리스트

### Backend
- [ ] 과제 생성 (draft 상태, 필수 필드 검증)
- [ ] 마감일 검증 (현재 시각 이후)
- [ ] 과제 조회 (단일, 제출물 통계 포함/미포함)
- [ ] 과제 목록 조회 (제출물 통계 포함)
- [ ] 과제 수정 (소유자만 가능)
- [ ] 과제 상태 전환 (draft→published, published→closed)
- [ ] 유효하지 않은 상태 전환 차단 (closed→published)
- [ ] 제출물 통계 계산 정확성
- [ ] DB 에러 처리
- [ ] 인증 실패 처리 (401)
- [ ] 권한 없음 처리 (403, 비소유자/Learner 접근 시)

### Frontend
- [ ] 과제 생성 폼 렌더링 및 제출
- [ ] 과제 수정 폼 렌더링 (기존 값) 및 제출
- [ ] 필수 필드 검증 (제목, 설명, 마감일, 점수 비중)
- [ ] 마감일 날짜 선택 (현재 시각 이후)
- [ ] 지각/재제출 정책 체크박스
- [ ] 과제 목록 표시 (제출물 통계 포함)
- [ ] 과제 상세 정보 표시
- [ ] 상태 전환 버튼 (draft/published에만 표시)
- [ ] 상태 전환 확인 다이얼로그
- [ ] 로딩 상태 표시
- [ ] 에러 상태 표시
- [ ] 성공 메시지 및 리다이렉트
- [ ] 반응형 레이아웃

**Note**: Frontend Components와 Pages는 UC-008 (코스 관리)과 매우 유사한 구조이므로, 동일한 패턴을 따라 구현합니다. 주요 차이점:
- AssignmentForm: 마감일 datetime picker, 지각/재제출 체크박스 추가
- AssignmentCard: 제출물 통계 (총 제출, 미채점, 지각, 재제출 요청) 표시
- AssignmentDetail: 제출물 통계 섹션 추가
