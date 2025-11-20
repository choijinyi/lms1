# UC-010: 제출물 채점 & 피드백 (Instructor) - Implementation Plan

## 개요

### Backend Modules
| 모듈명 | 위치 | 설명 |
|--------|------|------|
| Grading Service | `src/features/grading/backend/service.ts` | 제출물 조회 및 채점 비즈니스 로직 |
| Grading Route | `src/features/grading/backend/route.ts` | 제출물 조회 및 채점 API 라우트 정의 (GET/PUT) |
| Grading Schema | `src/features/grading/backend/schema.ts` | 요청/응답 zod 스키마 정의 |
| Grading Error | `src/features/grading/backend/error.ts` | 에러 코드 정의 |

### Frontend Modules
| 모듈명 | 위치 | 설명 |
|--------|------|------|
| Submission Query | `src/features/grading/hooks/useSubmissionQuery.ts` | 제출물 조회 Query 훅 |
| Grading Mutation | `src/features/grading/hooks/useGradingMutation.ts` | 제출물 채점 Mutation 훅 |
| Grading DTO | `src/features/grading/lib/dto.ts` | Backend 스키마 재노출 |
| Submission Detail Component | `src/features/grading/components/submission-detail.tsx` | 제출물 내용 표시 컴포넌트 |
| Grading Form Component | `src/features/grading/components/grading-form.tsx` | 채점 폼 컴포넌트 (점수, 피드백, 재제출 요청) |
| Grading Page | `src/app/(protected)/instructor/submissions/[id]/grade/page.tsx` | 제출물 채점 페이지 |

---

## Diagram

```mermaid
graph TB
    subgraph Frontend
        GradePage[Grading Page<br/>instructor/submissions/[id]/grade/page.tsx]

        SubmissionDetail[SubmissionDetail Component<br/>components/submission-detail.tsx]
        GradingForm[GradingForm Component<br/>components/grading-form.tsx]

        SubmissionQuery[useSubmissionQuery Hook<br/>hooks/useSubmissionQuery.ts]
        GradingMutation[useGradingMutation Hook<br/>hooks/useGradingMutation.ts]
        DTO[Grading DTO<br/>lib/dto.ts]
    end

    subgraph Backend
        Route[Grading Route<br/>backend/route.ts<br/>GET /api/submissions/:id<br/>PUT /api/submissions/:id/grade]
        Service[Grading Service<br/>backend/service.ts]
        Schema[Grading Schema<br/>backend/schema.ts]
        Error[Grading Error<br/>backend/error.ts]
    end

    subgraph Database
        Submissions[(submissions)]
        Assignments[(assignments)]
        Courses[(courses)]
        Profiles[(profiles)]
    end

    GradePage --> SubmissionDetail
    GradePage --> GradingForm
    GradePage --> SubmissionQuery

    SubmissionDetail --> SubmissionQuery
    GradingForm --> GradingMutation

    SubmissionQuery --> DTO
    GradingMutation --> DTO

    SubmissionQuery --> |HTTP GET| Route
    GradingMutation --> |HTTP PUT| Route

    Route --> Service
    Route --> Schema
    Service --> Schema
    Service --> Error
    Service --> Submissions
    Service --> Assignments
    Service --> Courses
    Service --> Profiles

    DTO -.re-export.-> Schema
```

---

## Implementation Plan

### 1. Backend: Grading Schema (`src/features/grading/backend/schema.ts`)

**책임**: 요청/응답 데이터 구조 정의 및 검증

**구현 내용**:
```typescript
import { z } from 'zod';

// 제출물 채점 요청 스키마
export const GradeSubmissionSchema = z.object({
  score: z.number().int().min(0).max(100),
  feedback: z.string().min(1).max(5000),
  requestResubmission: z.boolean(),
});

// 제출물 조회 응답 스키마
export const SubmissionResponseSchema = z.object({
  id: z.string().uuid(),
  assignmentId: z.string().uuid(),
  assignmentTitle: z.string(),
  courseId: z.string().uuid(),
  courseTitle: z.string(),
  userId: z.string().uuid(),
  userName: z.string(),
  text: z.string(),
  link: z.string().nullable(),
  late: z.boolean(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  submittedAt: z.string(),
  resubmittedAt: z.string().nullable(),
  gradedAt: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// 채점 응답 스키마
export const GradingResponseSchema = z.object({
  id: z.string().uuid(),
  score: z.number(),
  feedback: z.string(),
  status: z.enum(['graded', 'resubmission_required']),
  gradedAt: z.string(),
});

// DB Row 스키마
export const SubmissionRowSchema = z.object({
  id: z.string().uuid(),
  assignment_id: z.string().uuid(),
  user_id: z.string().uuid(),
  text: z.string(),
  link: z.string().nullable(),
  late: z.boolean(),
  score: z.number().nullable(),
  feedback: z.string().nullable(),
  status: z.enum(['submitted', 'graded', 'resubmission_required']),
  submitted_at: z.string(),
  resubmitted_at: z.string().nullable(),
  graded_at: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SubmissionWithDetailsRowSchema = SubmissionRowSchema.extend({
  assignment: z.object({
    id: z.string().uuid(),
    title: z.string(),
    course_id: z.string().uuid(),
    course: z.object({
      id: z.string().uuid(),
      title: z.string(),
      instructor_id: z.string().uuid(),
    }),
  }),
  user: z.object({
    id: z.string().uuid(),
    name: z.string(),
  }),
});

export type GradeSubmissionInput = z.infer<typeof GradeSubmissionSchema>;
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;
export type GradingResponse = z.infer<typeof GradingResponseSchema>;
export type SubmissionRow = z.infer<typeof SubmissionRowSchema>;
export type SubmissionWithDetailsRow = z.infer<typeof SubmissionWithDetailsRowSchema>;
```

**의존성**:
- `zod` 패키지

---

### 2. Backend: Grading Error (`src/features/grading/backend/error.ts`)

**책임**: 에러 코드 정의

**구현 내용**:
```typescript
export const gradingErrorCodes = {
  submissionNotFound: 'SUBMISSION_NOT_FOUND',
  gradeError: 'SUBMISSION_GRADE_ERROR',
  validationError: 'GRADING_VALIDATION_ERROR',
  unauthorized: 'GRADING_UNAUTHORIZED',
  forbidden: 'GRADING_FORBIDDEN',
  invalidScore: 'GRADING_INVALID_SCORE',
  invalidFeedback: 'GRADING_INVALID_FEEDBACK',
} as const;

type GradingErrorValue = (typeof gradingErrorCodes)[keyof typeof gradingErrorCodes];

export type GradingServiceError = GradingErrorValue;
```

**의존성**: 없음

---

### 3. Backend: Grading Service (`src/features/grading/backend/service.ts`)

**책임**: 제출물 조회 및 채점 비즈니스 로직

**구현 내용**:
```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import {
  GradeSubmissionSchema,
  SubmissionResponseSchema,
  GradingResponseSchema,
  SubmissionWithDetailsRowSchema,
  type GradeSubmissionInput,
  type SubmissionResponse,
  type GradingResponse,
} from './schema';
import { gradingErrorCodes, type GradingServiceError } from './error';

/**
 * DB Row를 Response로 변환
 */
const mapSubmissionToResponse = (row: any): SubmissionResponse => {
  return {
    id: row.id,
    assignmentId: row.assignment_id,
    assignmentTitle: row.assignment?.title || 'Unknown',
    courseId: row.assignment?.course_id || 'Unknown',
    courseTitle: row.assignment?.course?.title || 'Unknown',
    userId: row.user_id,
    userName: row.user?.name || 'Unknown',
    text: row.text,
    link: row.link,
    late: row.late,
    score: row.score,
    feedback: row.feedback,
    status: row.status,
    submittedAt: row.submitted_at,
    resubmittedAt: row.resubmitted_at,
    gradedAt: row.graded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/**
 * 제출물 조회 (Instructor용 - 권한 검증 포함)
 */
export const getSubmissionById = async (
  client: SupabaseClient,
  submissionId: string,
  instructorId: string,
): Promise<HandlerResult<SubmissionResponse, GradingServiceError, unknown>> => {
  const { data, error } = await client
    .from('submissions')
    .select(`
      *,
      assignment:assignments (
        id,
        title,
        course_id,
        course:courses (
          id,
          title,
          instructor_id
        )
      ),
      user:profiles (
        id,
        name
      )
    `)
    .eq('id', submissionId)
    .single();

  if (error || !data) {
    return failure(404, gradingErrorCodes.submissionNotFound, 'Submission not found');
  }

  const parsed = SubmissionWithDetailsRowSchema.safeParse(data);

  if (!parsed.success) {
    return failure(
      500,
      gradingErrorCodes.validationError,
      'Submission response validation failed',
      parsed.error.format(),
    );
  }

  // 권한 검증: 과제가 속한 코스의 instructor만 조회 가능
  if (parsed.data.assignment.course.instructor_id !== instructorId) {
    return failure(403, gradingErrorCodes.forbidden, 'Not the course instructor');
  }

  const response = mapSubmissionToResponse(parsed.data);

  return success(response);
};

/**
 * 제출물 채점
 */
export const gradeSubmission = async (
  client: SupabaseClient,
  submissionId: string,
  instructorId: string,
  input: GradeSubmissionInput,
): Promise<HandlerResult<GradingResponse, GradingServiceError, unknown>> => {
  // 1. 입력값 검증
  const validated = GradeSubmissionSchema.safeParse(input);

  if (!validated.success) {
    return failure(
      400,
      gradingErrorCodes.validationError,
      'Invalid grading data',
      validated.error.format(),
    );
  }

  // 2. 제출물 존재 및 권한 확인
  const { data: submission } = await client
    .from('submissions')
    .select(`
      id,
      assignment:assignments (
        id,
        course:courses (
          id,
          instructor_id
        )
      )
    `)
    .eq('id', submissionId)
    .single();

  if (!submission) {
    return failure(404, gradingErrorCodes.submissionNotFound, 'Submission not found');
  }

  // 3. 권한 검증: 과제가 속한 코스의 instructor만 채점 가능
  if (submission.assignment.course.instructor_id !== instructorId) {
    return failure(403, gradingErrorCodes.forbidden, 'Not the course instructor');
  }

  // 4. 점수 범위 검증 (추가 검증)
  if (validated.data.score < 0 || validated.data.score > 100) {
    return failure(
      400,
      gradingErrorCodes.invalidScore,
      'Score must be between 0 and 100',
    );
  }

  // 5. 피드백 필수 검증 (공백 제거 후)
  if (validated.data.feedback.trim().length === 0) {
    return failure(
      400,
      gradingErrorCodes.invalidFeedback,
      'Feedback cannot be empty',
    );
  }

  // 6. 상태 결정
  const newStatus = validated.data.requestResubmission ? 'resubmission_required' : 'graded';

  // 7. 제출물 업데이트
  const { data, error } = await client
    .from('submissions')
    .update({
      score: validated.data.score,
      feedback: validated.data.feedback,
      status: newStatus,
      graded_at: new Date().toISOString(),
    })
    .eq('id', submissionId)
    .select('id, score, feedback, status, graded_at')
    .single();

  if (error) {
    return failure(500, gradingErrorCodes.gradeError, error.message);
  }

  const parsed = GradingResponseSchema.safeParse({
    id: data.id,
    score: data.score,
    feedback: data.feedback,
    status: data.status,
    gradedAt: data.graded_at,
  });

  if (!parsed.success) {
    return failure(
      500,
      gradingErrorCodes.validationError,
      'Grading response validation failed',
      parsed.error.format(),
    );
  }

  return success(parsed.data);
};
```

**Unit Tests**:
```typescript
describe('Grading Service', () => {
  describe('getSubmissionById', () => {
    it('should return submission with details', async () => {
      const result = await getSubmissionById(mockClient, submissionId, instructorId);
      expect(result.ok).toBe(true);
      expect(result.data.id).toBe(submissionId);
      expect(result.data.assignmentTitle).toBeDefined();
      expect(result.data.courseTitle).toBeDefined();
      expect(result.data.userName).toBeDefined();
    });

    it('should reject non-instructor', async () => {
      const result = await getSubmissionById(mockClient, submissionId, otherUserId);
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(gradingErrorCodes.forbidden);
    });

    it('should return 404 for non-existent submission', async () => {
      const result = await getSubmissionById(mockClient, 'invalid-id', instructorId);
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(gradingErrorCodes.submissionNotFound);
    });
  });

  describe('gradeSubmission', () => {
    it('should grade submission with status graded', async () => {
      const result = await gradeSubmission(mockClient, submissionId, instructorId, {
        score: 85,
        feedback: '잘했습니다',
        requestResubmission: false,
      });
      expect(result.ok).toBe(true);
      expect(result.data.score).toBe(85);
      expect(result.data.status).toBe('graded');
      expect(result.data.gradedAt).toBeDefined();
    });

    it('should request resubmission', async () => {
      const result = await gradeSubmission(mockClient, submissionId, instructorId, {
        score: 60,
        feedback: '재제출 필요',
        requestResubmission: true,
      });
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe('resubmission_required');
    });

    it('should reject score out of range', async () => {
      const result = await gradeSubmission(mockClient, submissionId, instructorId, {
        score: 101,
        feedback: '테스트',
        requestResubmission: false,
      });
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(gradingErrorCodes.invalidScore);
    });

    it('should reject empty feedback', async () => {
      const result = await gradeSubmission(mockClient, submissionId, instructorId, {
        score: 85,
        feedback: '   ',
        requestResubmission: false,
      });
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(gradingErrorCodes.invalidFeedback);
    });

    it('should reject non-instructor', async () => {
      const result = await gradeSubmission(mockClient, submissionId, learnerId, {
        score: 85,
        feedback: '테스트',
        requestResubmission: false,
      });
      expect(result.ok).toBe(false);
      expect(result.error.code).toBe(gradingErrorCodes.forbidden);
    });

    it('should allow re-grading', async () => {
      // 첫 번째 채점
      await gradeSubmission(mockClient, submissionId, instructorId, {
        score: 70,
        feedback: '첫 번째 피드백',
        requestResubmission: false,
      });

      // 두 번째 채점 (재채점)
      const result = await gradeSubmission(mockClient, submissionId, instructorId, {
        score: 90,
        feedback: '재채점 피드백',
        requestResubmission: false,
      });

      expect(result.ok).toBe(true);
      expect(result.data.score).toBe(90);
      expect(result.data.feedback).toBe('재채점 피드백');
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

### 4. Backend: Grading Route (`src/features/grading/backend/route.ts`)

**책임**: Hono 라우트 정의 및 인증/권한 검증

**구현 내용**:
```typescript
import type { Hono } from 'hono';
import { failure, respond, type ErrorResult } from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import { getSubmissionById, gradeSubmission } from './service';
import { gradingErrorCodes, type GradingServiceError } from './error';
import { GradeSubmissionSchema } from './schema';

export const registerGradingRoutes = (app: Hono<AppEnv>) => {
  /**
   * GET /api/submissions/:id
   * 제출물 조회 (Instructor용)
   */
  app.get('/api/submissions/:id', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const submissionId = c.req.param('id');

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized access to submission', authError?.message);
      return respond(
        c,
        failure(401, gradingErrorCodes.unauthorized, 'Unauthorized'),
      );
    }

    // 사용자 역할 확인 (Instructor만 허용)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'instructor') {
      logger.warn('Non-instructor submission access attempt', { userId: user.id });
      return respond(
        c,
        failure(
          403,
          gradingErrorCodes.forbidden,
          'Only instructors can access submissions',
        ),
      );
    }

    const result = await getSubmissionById(supabase, submissionId, user.id);

    if (!result.ok) {
      const errorResult = result as ErrorResult<GradingServiceError, unknown>;

      if (errorResult.error.code === gradingErrorCodes.submissionNotFound) {
        logger.warn('Submission not found', { submissionId });
      } else if (errorResult.error.code === gradingErrorCodes.forbidden) {
        logger.warn('Forbidden submission access', { submissionId, userId: user.id });
      } else {
        logger.error('Failed to fetch submission', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info('Submission fetched successfully', { submissionId });
    return respond(c, result);
  });

  /**
   * PUT /api/submissions/:id/grade
   * 제출물 채점
   */
  app.put('/api/submissions/:id/grade', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const submissionId = c.req.param('id');

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized grade submission attempt', authError?.message);
      return respond(
        c,
        failure(401, gradingErrorCodes.unauthorized, 'Unauthorized'),
      );
    }

    // 사용자 역할 확인 (Instructor만 허용)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'instructor') {
      logger.warn('Non-instructor grade submission attempt', { userId: user.id });
      return respond(
        c,
        failure(
          403,
          gradingErrorCodes.forbidden,
          'Only instructors can grade submissions',
        ),
      );
    }

    // 요청 바디 파싱
    const body = await c.req.json();
    const parsedBody = GradeSubmissionSchema.safeParse(body);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          gradingErrorCodes.validationError,
          'Invalid request body',
          parsedBody.error.format(),
        ),
      );
    }

    const result = await gradeSubmission(supabase, submissionId, user.id, parsedBody.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<GradingServiceError, unknown>;
      logger.error('Failed to grade submission', errorResult.error.message);
      return respond(c, result);
    }

    logger.info('Submission graded successfully', {
      userId: user.id,
      submissionId,
      status: result.data.status,
    });
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
import { registerGradingRoutes } from '@/features/grading/backend/route';

export const createHonoApp = () => {
  // ... 기존 코드 ...

  // 라우트 등록
  registerExampleRoutes(app);
  registerGradesRoutes(app);
  registerInstructorDashboardRoutes(app);
  registerCoursesRoutes(app);
  registerAssignmentsRoutes(app);
  registerGradingRoutes(app); // 추가

  return app;
};
```

---

### 6. Frontend: Grading DTO (`src/features/grading/lib/dto.ts`)

**책임**: Backend 스키마 재노출

**구현 내용**:
```typescript
export {
  GradeSubmissionSchema,
  SubmissionResponseSchema,
  GradingResponseSchema,
  type GradeSubmissionInput,
  type SubmissionResponse,
  type GradingResponse,
} from '@/features/grading/backend/schema';
```

---

### 7. Frontend: Submission Query Hook (`src/features/grading/hooks/useSubmissionQuery.ts`)

**책임**: React Query 기반 제출물 조회

**구현 내용**:
```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { SubmissionResponseSchema } from '@/features/grading/lib/dto';

const fetchSubmission = async (submissionId: string) => {
  try {
    const { data } = await apiClient.get(`/api/submissions/${submissionId}`);
    return SubmissionResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to fetch submission.');
    throw new Error(message);
  }
};

export const useSubmissionQuery = (submissionId: string) =>
  useQuery({
    queryKey: ['submissions', submissionId],
    queryFn: () => fetchSubmission(submissionId),
    enabled: Boolean(submissionId),
    staleTime: 60 * 1000, // 1분
    retry: 2,
  });
```

**의존성**:
- `@tanstack/react-query`
- `@/lib/remote/api-client`
- `@/features/grading/lib/dto`

---

### 8. Frontend: Grading Mutation Hook (`src/features/grading/hooks/useGradingMutation.ts`)

**책임**: React Query 기반 제출물 채점 Mutation

**구현 내용**:
```typescript
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import {
  GradeSubmissionSchema,
  GradingResponseSchema,
  type GradeSubmissionInput,
} from '@/features/grading/lib/dto';

const gradeSubmission = async (submissionId: string, input: GradeSubmissionInput) => {
  try {
    const validated = GradeSubmissionSchema.parse(input);
    const { data } = await apiClient.put(`/api/submissions/${submissionId}/grade`, validated);
    return GradingResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, 'Failed to grade submission.');
    throw new Error(message);
  }
};

export const useGradingMutation = (submissionId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GradeSubmissionInput) => gradeSubmission(submissionId, input),
    onSuccess: () => {
      // 해당 제출물 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['submissions', submissionId] });
      // Instructor 대시보드 캐시 무효화 (채점 대기 수 변경)
      queryClient.invalidateQueries({ queryKey: ['instructor', 'dashboard'] });
      // 과제별 제출물 통계 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
    },
  });
};
```

**의존성**:
- `@tanstack/react-query`
- `@/lib/remote/api-client`
- `@/features/grading/lib/dto`

---

### 9. Frontend: Submission Detail Component (`src/features/grading/components/submission-detail.tsx`)

**책임**: 제출물 내용 표시

**구현 내용**:
```typescript
'use client';

import type { SubmissionResponse } from '@/features/grading/lib/dto';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface SubmissionDetailProps {
  submission: SubmissionResponse;
}

export function SubmissionDetail({ submission }: SubmissionDetailProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>제출물 정보</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">과제</p>
          <p className="font-medium">{submission.assignmentTitle}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">코스</p>
          <p className="font-medium">{submission.courseTitle}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">제출자</p>
          <p className="font-medium">{submission.userName}</p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">제출일시</p>
          <p className="font-medium">
            {format(new Date(submission.submittedAt), 'yyyy-MM-dd HH:mm:ss')}
            {submission.late && (
              <Badge variant="destructive" className="ml-2">
                지각
              </Badge>
            )}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">상태</p>
          <Badge
            variant={
              submission.status === 'graded'
                ? 'default'
                : submission.status === 'resubmission_required'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {submission.status === 'graded'
              ? '채점 완료'
              : submission.status === 'resubmission_required'
                ? '재제출 요청'
                : '제출됨'}
          </Badge>
        </div>

        <div>
          <p className="text-sm text-muted-foreground">제출 내용</p>
          <p className="mt-2 whitespace-pre-wrap rounded-md border p-3">
            {submission.text}
          </p>
        </div>

        {submission.link && (
          <div>
            <p className="text-sm text-muted-foreground">링크</p>
            <a
              href={submission.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {submission.link}
            </a>
          </div>
        )}

        {submission.score !== null && submission.feedback && (
          <>
            <div>
              <p className="text-sm text-muted-foreground">점수</p>
              <p className="text-2xl font-bold">{submission.score}점</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">피드백</p>
              <p className="mt-2 whitespace-pre-wrap rounded-md border p-3">
                {submission.feedback}
              </p>
            </div>

            {submission.gradedAt && (
              <div>
                <p className="text-sm text-muted-foreground">채점일시</p>
                <p className="font-medium">
                  {format(new Date(submission.gradedAt), 'yyyy-MM-dd HH:mm:ss')}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
```

**QA Sheet**:
| 항목 | 확인 내용 | 예상 결과 |
|------|-----------|-----------|
| 과제 제목 표시 | 제출물의 과제 제목이 표시되는가? | 과제 제목이 정확히 표시됨 |
| 코스 제목 표시 | 제출물의 코스 제목이 표시되는가? | 코스 제목이 정확히 표시됨 |
| 제출자 이름 표시 | 제출자의 이름이 표시되는가? | 제출자 이름이 정확히 표시됨 |
| 제출일시 표시 | 제출일시가 포맷팅되어 표시되는가? | yyyy-MM-dd HH:mm:ss 형식으로 표시됨 |
| 지각 뱃지 표시 | late=true일 때 "지각" 뱃지가 표시되는가? | 지각 뱃지가 빨간색으로 표시됨 |
| 상태 뱃지 표시 | 상태에 따라 뱃지가 다르게 표시되는가? | graded/resubmission_required/submitted에 따라 뱃지 색상 다름 |
| 제출 내용 표시 | 텍스트 내용이 줄바꿈을 유지하며 표시되는가? | whitespace-pre-wrap으로 줄바꿈 유지됨 |
| 링크 표시 | 링크가 있을 때만 표시되고 클릭 가능한가? | 링크 클릭 시 새 탭에서 열림 |
| 점수/피드백 표시 | 채점된 경우 점수와 피드백이 표시되는가? | 점수와 피드백이 정확히 표시됨 |
| 채점일시 표시 | 채점일시가 포맷팅되어 표시되는가? | yyyy-MM-dd HH:mm:ss 형식으로 표시됨 |

**의존성**:
- `@/components/ui/card`
- `@/components/ui/badge`
- `date-fns`
- `@/features/grading/lib/dto`

---

### 10. Frontend: Grading Form Component (`src/features/grading/components/grading-form.tsx`)

**책임**: 채점 폼 (점수, 피드백, 재제출 요청)

**구현 내용**:
```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { GradeSubmissionSchema, type GradeSubmissionInput } from '@/features/grading/lib/dto';
import { useGradingMutation } from '@/features/grading/hooks/useGradingMutation';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface GradingFormProps {
  submissionId: string;
  initialScore?: number | null;
  initialFeedback?: string | null;
}

export function GradingForm({
  submissionId,
  initialScore,
  initialFeedback,
}: GradingFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [requestResubmission, setRequestResubmission] = useState(false);

  const form = useForm<GradeSubmissionInput>({
    resolver: zodResolver(GradeSubmissionSchema),
    defaultValues: {
      score: initialScore ?? 0,
      feedback: initialFeedback ?? '',
      requestResubmission: false,
    },
  });

  const gradingMutation = useGradingMutation(submissionId);

  const onSubmit = async (data: GradeSubmissionInput) => {
    try {
      await gradingMutation.mutateAsync(data);
      toast({
        title: '채점 완료',
        description: data.requestResubmission
          ? '재제출이 요청되었습니다.'
          : '채점이 완료되었습니다.',
      });
      router.back();
    } catch (error) {
      toast({
        title: '채점 실패',
        description: error instanceof Error ? error.message : '채점 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>채점하기</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>점수 (0~100)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      placeholder="점수를 입력하세요"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="feedback"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>피드백</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="피드백을 작성하세요 (필수)"
                      rows={6}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requestResubmission"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setRequestResubmission(checked === true);
                      }}
                    />
                  </FormControl>
                  <FormLabel className="!mt-0 cursor-pointer">
                    재제출 요청
                  </FormLabel>
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={gradingMutation.isPending}
              >
                취소
              </Button>
              <Button type="submit" disabled={gradingMutation.isPending}>
                {gradingMutation.isPending
                  ? '채점 중...'
                  : requestResubmission
                    ? '재제출 요청'
                    : '채점 완료'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
```

**QA Sheet**:
| 항목 | 확인 내용 | 예상 결과 |
|------|-----------|-----------|
| 점수 입력 제한 | 점수 입력 시 0~100 범위로 제한되는가? | HTML5 min/max로 제한됨 |
| 점수 유효성 검증 | 점수가 0 미만 또는 100 초과 시 에러 메시지가 표시되는가? | zod 검증으로 에러 표시됨 |
| 피드백 필수 검증 | 피드백이 비어있을 때 에러 메시지가 표시되는가? | zod 검증으로 에러 표시됨 |
| 재제출 요청 체크박스 | 체크박스 선택 시 버튼 텍스트가 변경되는가? | "채점 완료" → "재제출 요청"으로 변경됨 |
| 초기값 설정 | 기존 점수/피드백이 있을 때 초기값으로 설정되는가? | initialScore/initialFeedback으로 초기화됨 |
| 제출 중 상태 | 제출 중 버튼이 비활성화되고 "채점 중..."으로 표시되는가? | isPending 상태로 버튼 비활성화됨 |
| 성공 시 토스트 | 채점 성공 시 성공 토스트가 표시되는가? | "채점 완료" 토스트 표시됨 |
| 실패 시 토스트 | 채점 실패 시 에러 토스트가 표시되는가? | "채점 실패" 토스트 표시됨 |
| 성공 시 리다이렉트 | 채점 성공 시 이전 페이지로 이동하는가? | router.back() 호출됨 |
| 취소 버튼 | 취소 버튼 클릭 시 이전 페이지로 이동하는가? | router.back() 호출됨 |

**의존성**:
- `react-hook-form`
- `@hookform/resolvers/zod`
- `next/navigation`
- `@/components/ui/button`
- `@/components/ui/form`
- `@/components/ui/input`
- `@/components/ui/textarea`
- `@/components/ui/checkbox`
- `@/components/ui/card`
- `@/hooks/use-toast`
- `@/features/grading/lib/dto`
- `@/features/grading/hooks/useGradingMutation`

---

### 11. Frontend: Grading Page (`src/app/(protected)/instructor/submissions/[id]/grade/page.tsx`)

**책임**: 제출물 채점 페이지

**구현 내용**:
```typescript
'use client';

import { use } from 'react';
import { useSubmissionQuery } from '@/features/grading/hooks/useSubmissionQuery';
import { SubmissionDetail } from '@/features/grading/components/submission-detail';
import { GradingForm } from '@/features/grading/components/grading-form';

interface GradingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function GradingPage({ params }: GradingPageProps) {
  const resolvedParams = use(params);
  const submissionId = resolvedParams.id;

  const { data: submission, isLoading, error } = useSubmissionQuery(submissionId);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <p>제출물을 불러오는 중...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-destructive">
          제출물을 불러오는데 실패했습니다: {error?.message}
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="mb-6 text-3xl font-bold">제출물 채점</h1>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <SubmissionDetail submission={submission} />
        </div>

        <div>
          <GradingForm
            submissionId={submissionId}
            initialScore={submission.score}
            initialFeedback={submission.feedback}
          />
        </div>
      </div>
    </div>
  );
}
```

**QA Sheet**:
| 항목 | 확인 내용 | 예상 결과 |
|------|-----------|-----------|
| 로딩 상태 표시 | 데이터 로딩 중 "제출물을 불러오는 중..." 메시지가 표시되는가? | 로딩 메시지 표시됨 |
| 에러 상태 표시 | 데이터 로딩 실패 시 에러 메시지가 표시되는가? | 에러 메시지 표시됨 |
| 페이지 레이아웃 | 제출물 정보와 채점 폼이 2열로 표시되는가? | grid-cols-2로 2열 레이아웃 |
| 반응형 레이아웃 | 모바일에서 1열로 변경되는가? | lg 미만에서 1열로 변경됨 |
| 제출물 정보 표시 | SubmissionDetail 컴포넌트가 정상 렌더링되는가? | 제출물 정보 표시됨 |
| 채점 폼 표시 | GradingForm 컴포넌트가 정상 렌더링되는가? | 채점 폼 표시됨 |
| 초기값 전달 | 기존 점수/피드백이 폼에 전달되는가? | initialScore/initialFeedback 전달됨 |

**의존성**:
- `react`
- `@/features/grading/hooks/useSubmissionQuery`
- `@/features/grading/components/submission-detail`
- `@/features/grading/components/grading-form`

---

## 구현 순서

1. **Backend Schema & Error** 정의
2. **Backend Service** 구현 및 Unit Test 작성
3. **Backend Route** 구현 및 Hono App 통합
4. **Frontend DTO** 작성
5. **Frontend Hooks** 구현 (Query, Mutation)
6. **Frontend Components** 구현 (SubmissionDetail, GradingForm)
7. **Frontend Page** 구현
8. **통합 테스트** 수행

---

## 테스트 체크리스트

### Backend
- [ ] 제출물 조회 (instructor만 가능)
- [ ] 제출물 조회 권한 검증 (과제의 코스 소유자만)
- [ ] 제출물 채점 (점수, 피드백, 상태 업데이트)
- [ ] 점수 범위 검증 (0~100)
- [ ] 피드백 필수 검증 (빈 문자열 차단)
- [ ] 재제출 요청 상태 전환 (resubmission_required)
- [ ] 일반 채점 상태 전환 (graded)
- [ ] 재채점 허용 (기존 채점 덮어쓰기)
- [ ] 채점일시 자동 기록 (graded_at)
- [ ] DB 에러 처리
- [ ] 인증 실패 처리 (401)
- [ ] 권한 없음 처리 (403, 비소유자/Learner 접근 시)
- [ ] 존재하지 않는 제출물 처리 (404)

### Frontend
- [ ] 제출물 정보 표시 (과제, 코스, 제출자, 제출일시, 지각 여부, 상태)
- [ ] 제출 내용 표시 (텍스트, 링크)
- [ ] 기존 점수/피드백 표시 (채점된 경우)
- [ ] 점수 입력 폼 (0~100 범위)
- [ ] 피드백 입력 폼 (필수, textarea)
- [ ] 재제출 요청 체크박스
- [ ] 버튼 텍스트 변경 (재제출 요청 여부에 따라)
- [ ] 채점 중 로딩 상태
- [ ] 성공 시 토스트 및 리다이렉트
- [ ] 실패 시 에러 토스트
- [ ] 취소 버튼 (이전 페이지로)
- [ ] 반응형 레이아웃 (모바일: 1열, 데스크톱: 2열)
- [ ] 로딩 상태 표시
- [ ] 에러 상태 표시
