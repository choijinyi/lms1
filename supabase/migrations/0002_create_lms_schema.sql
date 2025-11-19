-- Migration: Create LMS (Learning Management System) schema
-- Creates tables for courses, assignments, submissions, enrollments, and reports

-- Ensure pgcrypto is available for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. profiles (사용자 프로필)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('learner', 'instructor', 'operator')),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

COMMENT ON TABLE public.profiles IS '사용자 프로필 - Supabase Auth와 1:1 매핑';

ALTER TABLE IF EXISTS public.profiles DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 2. terms_agreements (약관 동의 이력)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.terms_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agreed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_terms_agreements_user_id ON public.terms_agreements(user_id);

COMMENT ON TABLE public.terms_agreements IS '약관 동의 이력';

ALTER TABLE IF EXISTS public.terms_agreements DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. metadata_categories (카테고리 메타데이터)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.metadata_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metadata_categories_active ON public.metadata_categories(active);

COMMENT ON TABLE public.metadata_categories IS '코스 카테고리 메타데이터 (운영자 관리)';

ALTER TABLE IF EXISTS public.metadata_categories DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. metadata_difficulties (난이도 메타데이터)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.metadata_difficulties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_metadata_difficulties_active ON public.metadata_difficulties(active);

COMMENT ON TABLE public.metadata_difficulties IS '코스 난이도 메타데이터 (운영자 관리)';

ALTER TABLE IF EXISTS public.metadata_difficulties DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. courses (코스)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  curriculum JSONB,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_courses_instructor_id ON public.courses(instructor_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_difficulty ON public.courses(difficulty);

COMMENT ON TABLE public.courses IS '강사가 개설한 코스';

ALTER TABLE IF EXISTS public.courses DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. enrollments (수강 신청)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_at ON public.enrollments(enrolled_at);

COMMENT ON TABLE public.enrollments IS '학습자의 코스 수강 신청 기록 (중복 방지)';

ALTER TABLE IF EXISTS public.enrollments DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 7. assignments (과제)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  weight NUMERIC(5,2) NOT NULL DEFAULT 1.0,
  allow_late BOOLEAN NOT NULL DEFAULT FALSE,
  allow_resubmit BOOLEAN NOT NULL DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON public.assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_due_date ON public.assignments(due_date);

COMMENT ON TABLE public.assignments IS '코스에 속한 과제 정보 및 정책';

ALTER TABLE IF EXISTS public.assignments DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 8. submissions (과제 제출물)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  link TEXT,
  late BOOLEAN NOT NULL DEFAULT FALSE,
  score NUMERIC(5,2),
  feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'graded', 'resubmission_required')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resubmitted_at TIMESTAMPTZ,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment_id ON public.submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON public.submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON public.submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_late ON public.submissions(late);
CREATE INDEX IF NOT EXISTS idx_submissions_graded_at ON public.submissions(graded_at);

COMMENT ON TABLE public.submissions IS '학습자의 과제 제출물 및 채점 정보';

ALTER TABLE IF EXISTS public.submissions DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 9. reports (신고)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('course', 'assignment', 'submission', 'user')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'investigating', 'resolved')),
  action TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_target_type ON public.reports(target_type);
CREATE INDEX IF NOT EXISTS idx_reports_target_id ON public.reports(target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

COMMENT ON TABLE public.reports IS '운영자가 처리하는 신고 관리';

ALTER TABLE IF EXISTS public.reports DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Triggers: updated_at 자동 갱신
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- terms_agreements
DROP TRIGGER IF EXISTS update_terms_agreements_updated_at ON public.terms_agreements;
CREATE TRIGGER update_terms_agreements_updated_at
  BEFORE UPDATE ON public.terms_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- metadata_categories
DROP TRIGGER IF EXISTS update_metadata_categories_updated_at ON public.metadata_categories;
CREATE TRIGGER update_metadata_categories_updated_at
  BEFORE UPDATE ON public.metadata_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- metadata_difficulties
DROP TRIGGER IF EXISTS update_metadata_difficulties_updated_at ON public.metadata_difficulties;
CREATE TRIGGER update_metadata_difficulties_updated_at
  BEFORE UPDATE ON public.metadata_difficulties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- courses
DROP TRIGGER IF EXISTS update_courses_updated_at ON public.courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- enrollments
DROP TRIGGER IF EXISTS update_enrollments_updated_at ON public.enrollments;
CREATE TRIGGER update_enrollments_updated_at
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- assignments
DROP TRIGGER IF EXISTS update_assignments_updated_at ON public.assignments;
CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- submissions
DROP TRIGGER IF EXISTS update_submissions_updated_at ON public.submissions;
CREATE TRIGGER update_submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- reports
DROP TRIGGER IF EXISTS update_reports_updated_at ON public.reports;
CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Seed Data: 초기 메타데이터
-- ============================================================================

-- 난이도 초기 데이터
INSERT INTO public.metadata_difficulties (name)
VALUES
  ('beginner'),
  ('intermediate'),
  ('advanced')
ON CONFLICT (name) DO NOTHING;

-- 카테고리 초기 데이터 (예시)
INSERT INTO public.metadata_categories (name)
VALUES
  ('Programming'),
  ('Design'),
  ('Business'),
  ('Marketing')
ON CONFLICT (name) DO NOTHING;
