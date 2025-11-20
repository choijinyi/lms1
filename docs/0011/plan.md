# UC-011: Assignment 게시/마감 (Instructor) - Implementation Plan

## 개요

**Note**: UC-011은 UC-009 (과제 관리)의 확장입니다. UC-009에서 이미 구현된 상태 전환 기능을 활용하며, 마감일 자동 마감 로직과 프론트엔드 확인 다이얼로그를 추가합니다.

### Backend Modules (UC-009 확장)
| 모듈명 | 위치 | 설명 | 상태 |
|--------|------|------|------|
| Assignments Service | `src/features/assignments/backend/service.ts` | 마감일 자동 마감 로직 추가 | **확장** |
| Assignments Route | `src/features/assignments/backend/route.ts` | 상태 전환 API (UC-009에서 구현됨) | 재사용 |
| Assignments Schema | `src/features/assignments/backend/schema.ts` | 요청/응답 스키마 (UC-009에서 구현됨) | 재사용 |
| Assignments Error | `src/features/assignments/backend/error.ts` | 에러 코드 (UC-009에서 구현됨) | 재사용 |

### Frontend Modules (UC-009 확장)
| 모듈명 | 위치 | 설명 | 상태 |
|--------|------|------|------|
| Assignment Status Button | `src/features/assignments/components/assignment-status-button.tsx` | 게시/마감 버튼 + 확인 다이얼로그 | **확장** |
| Update Status Mutation | `src/features/assignments/hooks/useAssignmentMutations.ts` | 상태 전환 Mutation (UC-009에서 구현됨) | 재사용 |
| Assignment DTO | `src/features/assignments/lib/dto.ts` | Backend 스키마 재노출 (UC-009에서 구현됨) | 재사용 |

---

## Diagram

```mermaid
graph TB
    subgraph Frontend
        DetailPage[Assignment Detail Page<br/>instructor/assignments/[id]/page.tsx]

        StatusButton[AssignmentStatusButton<br/>components/assignment-status-button.tsx<br/>확장: 확인 다이얼로그 추가]
        ConfirmDialog[Confirmation Dialog<br/>게시/마감 확인]

        Mutations[useUpdateAssignmentStatusMutation<br/>hooks/useAssignmentMutations.ts<br/>UC-009에서 구현됨]
        DTO[Assignment DTO<br/>lib/dto.ts]
    end

    subgraph Backend
        Route[Assignments Route<br/>backend/route.ts<br/>PATCH /api/assignments/:id/status<br/>UC-009에서 구현됨]
        Service[Assignments Service<br/>backend/service.ts<br/>확장: autoCloseExpiredAssignments 추가]
        Schema[Assignments Schema<br/>backend/schema.ts]
        Error[Assignments Error<br/>backend/error.ts]
    end

    subgraph Database
        Assignments[(assignments)]
    end

    DetailPage --> StatusButton
    StatusButton --> ConfirmDialog
    StatusButton --> Mutations
    Mutations --> DTO

    Mutations --> |HTTP PATCH| Route
    Route --> Service
    Route --> Schema
    Service --> Schema
    Service --> Error
    Service --> Assignments

    DTO -.re-export.-> Schema

    note right of Service
        getAssignmentsByCourseId 수정:
        조회 시 마감일 지난 과제 자동 마감
    end note
```

---

## Implementation Plan

### 1. Backend: Assignments Service 확장 (`src/features/assignments/backend/service.ts`)

**책임**: 마감일 자동 마감 로직 추가

**추가 구현 내용**:
```typescript
/**
 * 마감일 지난 과제 자동 마감
 *
 * @description
 * - published 상태이면서 due_date가 현재 시각보다 이전인 과제를 closed로 전환
 * - 코스별 과제 목록 조회 시 자동으로 실행됨
 */
const autoCloseExpiredAssignments = async (
  client: SupabaseClient,
  courseId: string,
): Promise<void> => {
  const now = new Date().toISOString();

  // 마감일 지난 published 과제 조회
  const { data: expiredAssignments } = await client
    .from('assignments')
    .select('id')
    .eq('course_id', courseId)
    .eq('status', 'published')
    .lt('due_date', now);

  if (!expiredAssignments || expiredAssignments.length === 0) {
    return;
  }

  // 각 과제를 closed로 전환
  const updatePromises = expiredAssignments.map((assignment) =>
    client
      .from('assignments')
      .update({ status: 'closed' })
      .eq('id', assignment.id)
      .eq('status', 'published'), // 동시성 문제 방지
  );

  await Promise.all(updatePromises);
};

/**
 * 코스별 과제 목록 조회 (제출물 통계 포함)
 *
 * @description UC-011: 조회 시 마감일 지난 과제 자동 마감 로직 추가
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

  // 2. 마감일 지난 과제 자동 마감 (UC-011)
  await autoCloseExpiredAssignments(client, courseId);

  // 3. 과제 목록 조회
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

  // 4. 각 과제별 제출물 통계 조회
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
```

**Unit Tests**:
```typescript
describe('Assignments Service - UC-011', () => {
  describe('autoCloseExpiredAssignments', () => {
    it('should auto-close expired published assignments', async () => {
      // Mock: 2개의 과제 (1개는 마감일 지남, 1개는 마감일 전)
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 1일 전
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 1일 후

      // 마감일 지난 과제 생성
      await createAssignment(mockClient, courseId, instructorId, {
        title: 'Expired Assignment',
        description: 'Test',
        dueDate: expiredDate,
        weight: 10,
        allowLate: false,
        allowResubmit: false,
      });

      // 상태를 published로 변경
      await updateAssignmentStatus(mockClient, assignmentId, instructorId, {
        status: 'published',
      });

      // autoCloseExpiredAssignments 실행
      await autoCloseExpiredAssignments(mockClient, courseId);

      // 과제 상태가 closed로 변경되었는지 확인
      const result = await getAssignmentById(mockClient, assignmentId);
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe('closed');
    });

    it('should not close assignments with future due dates', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // 마감일 전 과제 생성 및 게시
      await createAssignment(mockClient, courseId, instructorId, {
        title: 'Future Assignment',
        description: 'Test',
        dueDate: futureDate,
        weight: 10,
        allowLate: false,
        allowResubmit: false,
      });

      await updateAssignmentStatus(mockClient, assignmentId, instructorId, {
        status: 'published',
      });

      // autoCloseExpiredAssignments 실행
      await autoCloseExpiredAssignments(mockClient, courseId);

      // 과제 상태가 published로 유지되는지 확인
      const result = await getAssignmentById(mockClient, assignmentId);
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe('published');
    });

    it('should not close draft assignments', async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // 마감일 지났지만 draft 상태인 과제
      await createAssignment(mockClient, courseId, instructorId, {
        title: 'Draft Assignment',
        description: 'Test',
        dueDate: expiredDate,
        weight: 10,
        allowLate: false,
        allowResubmit: false,
      });

      // autoCloseExpiredAssignments 실행
      await autoCloseExpiredAssignments(mockClient, courseId);

      // 과제 상태가 draft로 유지되는지 확인
      const result = await getAssignmentById(mockClient, assignmentId);
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe('draft');
    });

    it('should not close already closed assignments', async () => {
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      // 이미 closed 상태인 과제
      await createAssignment(mockClient, courseId, instructorId, {
        title: 'Closed Assignment',
        description: 'Test',
        dueDate: expiredDate,
        weight: 10,
        allowLate: false,
        allowResubmit: false,
      });

      await updateAssignmentStatus(mockClient, assignmentId, instructorId, {
        status: 'published',
      });
      await updateAssignmentStatus(mockClient, assignmentId, instructorId, {
        status: 'closed',
      });

      // autoCloseExpiredAssignments 실행
      await autoCloseExpiredAssignments(mockClient, courseId);

      // 과제 상태가 closed로 유지되는지 확인
      const result = await getAssignmentById(mockClient, assignmentId);
      expect(result.ok).toBe(true);
      expect(result.data.status).toBe('closed');
    });
  });

  describe('getAssignmentsByCourseId with auto-close', () => {
    it('should auto-close expired assignments when fetching list', async () => {
      // Mock: 3개의 과제 (draft, published-expired, published-future)
      const expiredDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      // 과제 3개 생성
      const assignment1 = await createAssignment(mockClient, courseId, instructorId, {
        title: 'Draft',
        description: 'Test',
        dueDate: futureDate,
        weight: 10,
        allowLate: false,
        allowResubmit: false,
      });

      const assignment2 = await createAssignment(mockClient, courseId, instructorId, {
        title: 'Published Expired',
        description: 'Test',
        dueDate: expiredDate,
        weight: 10,
        allowLate: false,
        allowResubmit: false,
      });
      await updateAssignmentStatus(mockClient, assignment2.id, instructorId, {
        status: 'published',
      });

      const assignment3 = await createAssignment(mockClient, courseId, instructorId, {
        title: 'Published Future',
        description: 'Test',
        dueDate: futureDate,
        weight: 10,
        allowLate: false,
        allowResubmit: false,
      });
      await updateAssignmentStatus(mockClient, assignment3.id, instructorId, {
        status: 'published',
      });

      // 과제 목록 조회 (자동 마감 실행)
      const result = await getAssignmentsByCourseId(mockClient, courseId, instructorId);

      expect(result.ok).toBe(true);
      const assignments = result.data.assignments;

      // 상태 확인
      const draftAssignment = assignments.find((a) => a.title === 'Draft');
      const expiredAssignment = assignments.find((a) => a.title === 'Published Expired');
      const futureAssignment = assignments.find((a) => a.title === 'Published Future');

      expect(draftAssignment.status).toBe('draft');
      expect(expiredAssignment.status).toBe('closed'); // 자동 마감됨
      expect(futureAssignment.status).toBe('published');
    });
  });
});
```

**의존성**:
- `@supabase/supabase-js`
- `@/backend/http/response`
- `./schema` (UC-009에서 정의)
- `./error` (UC-009에서 정의)

---

### 2. Frontend: Assignment Status Button 확장 (`src/features/assignments/components/assignment-status-button.tsx`)

**책임**: 게시/마감 버튼 + 확인 다이얼로그

**구현 내용** (UC-009에서 확장):
```typescript
'use client';

import { useState } from 'react';
import { useUpdateAssignmentStatusMutation } from '@/features/assignments/hooks/useAssignmentMutations';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface AssignmentStatusButtonProps {
  assignmentId: string;
  currentStatus: 'draft' | 'published' | 'closed';
}

export function AssignmentStatusButton({
  assignmentId,
  currentStatus,
}: AssignmentStatusButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'publish' | 'close' | null>(null);
  const { toast } = useToast();

  const updateStatusMutation = useUpdateAssignmentStatusMutation(assignmentId);

  const handleButtonClick = (action: 'publish' | 'close') => {
    setPendingAction(action);
    setIsDialogOpen(true);
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;

    try {
      const newStatus = pendingAction === 'publish' ? 'published' : 'closed';
      await updateStatusMutation.mutateAsync({ status: newStatus });

      toast({
        title: pendingAction === 'publish' ? '과제 게시 완료' : '과제 마감 완료',
        description:
          pendingAction === 'publish'
            ? '과제가 게시되었습니다.'
            : '과제가 마감되었습니다.',
      });

      setIsDialogOpen(false);
      setPendingAction(null);
    } catch (error) {
      toast({
        title: '상태 전환 실패',
        description: error instanceof Error ? error.message : '상태 전환 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setIsDialogOpen(false);
    setPendingAction(null);
  };

  // 상태별 버튼 렌더링
  const renderButton = () => {
    if (currentStatus === 'draft') {
      return (
        <Button onClick={() => handleButtonClick('publish')}>게시</Button>
      );
    }

    if (currentStatus === 'published') {
      return (
        <Button onClick={() => handleButtonClick('close')} variant="destructive">
          마감
        </Button>
      );
    }

    // closed 상태: 버튼 비활성화
    return (
      <Button disabled variant="outline">
        마감됨
      </Button>
    );
  };

  // 확인 다이얼로그 내용
  const getDialogContent = () => {
    if (pendingAction === 'publish') {
      return {
        title: '과제 게시',
        description: '과제를 게시하시겠습니까? 게시 후 학습자가 과제를 확인할 수 있습니다.',
        confirmText: '게시',
      };
    }

    if (pendingAction === 'close') {
      return {
        title: '과제 마감',
        description:
          '과제를 마감하시겠습니까? 마감 후 학습자는 제출할 수 없습니다.',
        confirmText: '마감',
      };
    }

    return {
      title: '',
      description: '',
      confirmText: '',
    };
  };

  const dialogContent = getDialogContent();

  return (
    <>
      {renderButton()}

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              disabled={updateStatusMutation.isPending}
            >
              {updateStatusMutation.isPending ? '처리 중...' : dialogContent.confirmText}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
```

**QA Sheet**:
| 항목 | 확인 내용 | 예상 결과 |
|------|-----------|-----------|
| draft 상태 버튼 | draft 상태일 때 "게시" 버튼이 표시되는가? | "게시" 버튼 표시됨 |
| published 상태 버튼 | published 상태일 때 "마감" 버튼이 표시되는가? | "마감" 버튼 (빨간색) 표시됨 |
| closed 상태 버튼 | closed 상태일 때 버튼이 비활성화되는가? | "마감됨" 버튼 비활성화됨 |
| 게시 확인 다이얼로그 | 게시 버튼 클릭 시 확인 다이얼로그가 표시되는가? | "과제를 게시하시겠습니까?" 다이얼로그 표시됨 |
| 마감 확인 다이얼로그 | 마감 버튼 클릭 시 확인 다이얼로그가 표시되는가? | "과제를 마감하시겠습니까?" 다이얼로그 표시됨 |
| 다이얼로그 취소 | 취소 버튼 클릭 시 다이얼로그가 닫히는가? | 다이얼로그 닫힘, 상태 변경 없음 |
| 게시 확인 | 게시 확인 시 상태가 published로 변경되는가? | 상태가 published로 변경됨 |
| 마감 확인 | 마감 확인 시 상태가 closed로 변경되는가? | 상태가 closed로 변경됨 |
| 성공 시 토스트 | 상태 전환 성공 시 성공 토스트가 표시되는가? | "과제 게시 완료" 또는 "과제 마감 완료" 토스트 표시됨 |
| 실패 시 토스트 | 상태 전환 실패 시 에러 토스트가 표시되는가? | "상태 전환 실패" 토스트 표시됨 |
| 처리 중 상태 | 상태 전환 중 버튼이 비활성화되고 "처리 중..."으로 표시되는가? | 버튼 비활성화, "처리 중..." 표시됨 |

**의존성**:
- `@/features/assignments/hooks/useAssignmentMutations` (UC-009에서 구현)
- `@/components/ui/button`
- `@/components/ui/alert-dialog`
- `@/hooks/use-toast`

---

### 3. Shadcn UI 컴포넌트 설치

**필요 컴포넌트**:
```bash
npx shadcn@latest add alert-dialog
```

---

## 구현 순서

1. **Backend Service 확장**
   - `autoCloseExpiredAssignments` 함수 추가
   - `getAssignmentsByCourseId` 함수에 자동 마감 로직 통합
   - Unit Test 작성

2. **Frontend Component 확장**
   - Shadcn UI `alert-dialog` 설치
   - `AssignmentStatusButton` 컴포넌트 구현 (확인 다이얼로그 추가)

3. **통합 테스트**
   - 과제 게시/마감 플로우 테스트
   - 마감일 자동 마감 테스트
   - 확인 다이얼로그 테스트

---

## 테스트 체크리스트

### Backend
- [ ] 마감일 지난 published 과제 자동 마감
- [ ] 마감일 전 과제는 자동 마감되지 않음
- [ ] draft/closed 상태 과제는 자동 마감 대상이 아님
- [ ] 과제 목록 조회 시 자동 마감 실행
- [ ] 동시성 문제 처리 (여러 요청이 동시에 자동 마감 시도)

### Frontend
- [ ] draft 상태에서 "게시" 버튼 표시
- [ ] published 상태에서 "마감" 버튼 표시
- [ ] closed 상태에서 버튼 비활성화
- [ ] 게시 버튼 클릭 시 확인 다이얼로그 표시
- [ ] 마감 버튼 클릭 시 확인 다이얼로그 표시
- [ ] 다이얼로그 취소 시 상태 변경 없음
- [ ] 다이얼로그 확인 시 상태 전환
- [ ] 성공 시 성공 토스트 표시
- [ ] 실패 시 에러 토스트 표시
- [ ] 처리 중 버튼 비활성화

---

## 참고사항

### UC-009와의 관계
- UC-009에서 이미 `updateAssignmentStatus` 함수와 `PATCH /api/assignments/:id/status` 엔드포인트가 구현되어 있음
- UC-011은 UC-009의 확장으로, 다음 기능을 추가함:
  1. **Backend**: 마감일 자동 마감 로직
  2. **Frontend**: 게시/마감 확인 다이얼로그

### 자동 마감 로직 실행 시점
- 과제 목록 조회 시 (`getAssignmentsByCourseId`)
- 실시간 배치 작업이 아닌, 조회 시점에 자동 마감 처리
- 성능 최적화를 위해 코스별로만 자동 마감 실행

### 상태 전환 규칙 (UC-009에서 정의)
- `draft → published`: 허용
- `draft → closed`: 허용
- `published → closed`: 허용
- `closed → published`: 불가
- `closed → draft`: 불가
- `published → draft`: 불가
