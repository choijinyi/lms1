-- Seed Data: Insert sample courses for the current user
-- 1. Replace 'YOUR_EMAIL_HERE' with your actual login email
-- 2. Run this query in Supabase SQL Editor

DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Find user ID by email
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'YOUR_EMAIL_HERE';

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User not found. Please check the email address.';
  ELSE
    -- Update profile role to instructor
    UPDATE public.profiles SET role = 'instructor' WHERE id = v_user_id;

    -- Insert Sample Courses
    INSERT INTO public.courses (instructor_id, title, description, category, difficulty, status, curriculum)
    VALUES
      (v_user_id, 'React 완벽 가이드', 'Hooks, Redux, Next.js까지 모던 React 개발의 모든 것을 배웁니다.', 'Programming', 'intermediate', 'published', '{"modules": ["Intro", "Hooks", "Next.js"]}'),
      (v_user_id, '파이썬 데이터 분석 기초', 'Pandas와 Matplotlib을 활용한 데이터 시각화 및 분석 입문', 'Data Science', 'beginner', 'published', '{"modules": ["Python Basics", "Pandas", "Matplotlib"]}'),
      (v_user_id, '실전 UX/UI 디자인 패턴', '사용자를 사로잡는 인터페이스 설계 원칙과 피그마 실습', 'Design', 'beginner', 'published', '{"modules": ["UX Theory", "Figma", "Prototyping"]}')
    ON CONFLICT DO NOTHING;
    
    RAISE NOTICE 'Sample courses added successfully for user %', v_user_id;
  END IF;
END $$;

