# Database Schema & Data Flow

## 데이터베이스 관점 데이터 플로우

### 1. 회원가입 & 온보딩
```
Supabase Auth (users)
  → profiles (role, name, phone, created_at)
  → terms_agreements (user_id, agreed_at)
```

### 2. 코스 탐색 & 수강신청
```
courses (status=published 필터)
  → enrollments (user_id, course_id, enrolled_at)
```

### 3. Learner 대시보드 데이터 집계
```
enrollments (user_id 필터)
  → courses (조인)
  → assignments (course_id 필터, published만)
    → submissions (user_id + assignment_id 필터) → 진행률 계산
    → due_date < now() → 마감 임박 필터링
```

### 4. 과제 제출
```
assignments (published & 수강여부 검증)
  → submissions (user_id, assignment_id, text, link, late, status=submitted)
```

### 5. 채점 & 피드백
```
submissions (assignment_id 필터, status=submitted)
  → submissions.score, feedback, graded_at 업데이트
  → status → graded or resubmission_required
```

### 6. 재제출
```
submissions (status=resubmission_required)
  → submissions (text, link 업데이트, resubmitted_at, status=submitted)
```

### 7. 성적 조회
```
enrollments (user_id)
  → assignments (course_id)
    → submissions (user_id + assignment_id) 조인
      → score, weight로 총점 계산
```

### 8. Instructor 대시보드
```
courses (instructor_id 필터)
  → assignments (course_id)
    → submissions (status != graded) count → 채점 대기
```

### 9. 신고 처리 (운영)
```
reports (target_type, target_id, reporter_id, status=received)
  → status 업데이트 (investigating → resolved)
```

---

## PostgreSQL Schema

### 1. profiles (사용자 프로필)
```sql
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('learner', 'instructor', 'operator')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
```

**용도**: Supabase Auth 사용자와 1:1 매핑되는 프로필 정보 저장

---

### 2. terms_agreements (약관 동의 이력)
```sql
CREATE TABLE IF NOT EXISTS terms_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agreed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_terms_agreements_user_id ON terms_agreements(user_id);
```

**용도**: 회원가입 시 약관 동의 이력 저장

---

### 3. courses (코스)
```sql
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  curriculum JSONB, -- 커리큘럼 자유 형식
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_courses_instructor_id ON courses(instructor_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_difficulty ON courses(difficulty);
```

**용도**: 강사가 개설한 코스 정보

---

### 4. enrollments (수강 신청)
```sql
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX idx_enrollments_enrolled_at ON enrollments(enrolled_at);
```

**용도**: 학습자의 코스 수강 신청 기록 (중복 방지)

---

### 5. assignments (과제)
```sql
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  weight NUMERIC(5,2) NOT NULL DEFAULT 1.0, -- 점수 비중
  allow_late BOOLEAN NOT NULL DEFAULT FALSE, -- 지각 허용 여부
  allow_resubmit BOOLEAN NOT NULL DEFAULT TRUE, -- 재제출 허용 여부
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_status ON assignments(status);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
```

**용도**: 코스에 속한 과제 정보 및 정책

---

### 6. submissions (과제 제출물)
```sql
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL, -- 제출 텍스트 (필수)
  link TEXT, -- 제출 링크 (선택)
  late BOOLEAN NOT NULL DEFAULT FALSE, -- 지각 여부
  score NUMERIC(5,2), -- 0~100
  feedback TEXT, -- 피드백
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'resubmission_required')),
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  resubmitted_at TIMESTAMPTZ, -- 재제출 시각
  graded_at TIMESTAMPTZ, -- 채점 시각
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, user_id) -- 한 과제당 한 사람당 하나의 제출물만
);

CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_late ON submissions(late);
CREATE INDEX idx_submissions_graded_at ON submissions(graded_at);
```

**용도**: 학습자의 과제 제출물 및 채점 정보

---

### 7. reports (신고)
```sql
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('course', 'assignment', 'submission', 'user')),
  target_id UUID NOT NULL, -- 대상의 ID (polymorphic)
  reason TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'investigating', 'resolved')),
  action TEXT, -- 처리 결과 (경고, 무효화, 계정 제한 등)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX idx_reports_target_type ON reports(target_type);
CREATE INDEX idx_reports_target_id ON reports(target_id);
CREATE INDEX idx_reports_status ON reports(status);
```

**용도**: 운영자가 처리하는 신고 관리

---

### 8. metadata_categories (카테고리 메타데이터)
```sql
CREATE TABLE IF NOT EXISTS metadata_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metadata_categories_active ON metadata_categories(active);
```

**용도**: 코스 카테고리 관리 (운영자가 CRUD)

---

### 9. metadata_difficulties (난이도 메타데이터)
```sql
CREATE TABLE IF NOT EXISTS metadata_difficulties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metadata_difficulties_active ON metadata_difficulties(active);
```

**용도**: 코스 난이도 관리 (운영자가 CRUD)

---

## 데이터 무결성 규칙

1. **enrollments**: `user_id + course_id` 유니크 제약으로 중복 수강 방지
2. **submissions**: `assignment_id + user_id` 유니크 제약으로 한 과제당 하나의 제출물만 허용
3. **courses.status**: `draft` → `published` → `archived` 순차 전환
4. **assignments.status**: `draft` → `published` → `closed` 순차 전환
5. **submissions.score**: 0~100 범위 제한 (애플리케이션 레벨에서 검증)
6. **submissions.late**: `due_date`와 `submitted_at` 비교로 결정
7. **profiles.role**: `learner`, `instructor`, `operator` 중 하나

---

## 주요 쿼리 패턴

### Learner 대시보드 진행률 계산
```sql
SELECT
  c.id,
  c.title,
  COUNT(a.id) FILTER (WHERE a.status = 'published') AS total_assignments,
  COUNT(s.id) FILTER (WHERE s.status = 'graded') AS completed_assignments
FROM enrollments e
JOIN courses c ON e.course_id = c.id
LEFT JOIN assignments a ON a.course_id = c.id
LEFT JOIN submissions s ON s.assignment_id = a.id AND s.user_id = e.user_id
WHERE e.user_id = $1 AND e.canceled_at IS NULL
GROUP BY c.id, c.title;
```

### 마감 임박 과제 (24시간 이내)
```sql
SELECT a.*
FROM assignments a
JOIN enrollments e ON e.course_id = a.course_id
LEFT JOIN submissions s ON s.assignment_id = a.id AND s.user_id = e.user_id
WHERE e.user_id = $1
  AND a.status = 'published'
  AND a.due_date BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
  AND s.id IS NULL
ORDER BY a.due_date ASC;
```

### Instructor 채점 대기 수
```sql
SELECT COUNT(s.id)
FROM submissions s
JOIN assignments a ON s.assignment_id = a.id
JOIN courses c ON a.course_id = c.id
WHERE c.instructor_id = $1
  AND s.status = 'submitted';
```

### 코스별 총점 계산
```sql
SELECT
  c.id,
  c.title,
  SUM(s.score * a.weight) AS total_score
FROM enrollments e
JOIN courses c ON e.course_id = c.id
JOIN assignments a ON a.course_id = c.id
LEFT JOIN submissions s ON s.assignment_id = a.id AND s.user_id = e.user_id
WHERE e.user_id = $1 AND s.status = 'graded'
GROUP BY c.id, c.title;
```

---

## Triggers (updated_at 자동 갱신)

모든 테이블에 `updated_at` 자동 갱신 트리거 적용:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 각 테이블마다 적용
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 나머지 테이블도 동일하게 적용
```

---

## 초기 시드 데이터 (Optional)

### metadata_difficulties
```sql
INSERT INTO metadata_difficulties (name) VALUES
  ('beginner'),
  ('intermediate'),
  ('advanced');
```

### metadata_categories (예시)
```sql
INSERT INTO metadata_categories (name) VALUES
  ('Programming'),
  ('Design'),
  ('Business'),
  ('Marketing');
```
