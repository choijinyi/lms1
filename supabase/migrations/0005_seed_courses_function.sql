-- Seed: Create an instructor profile and sample courses
-- Note: You should replace 'YOUR_USER_ID' with a real user UUID if you want to test with a specific account.
-- Otherwise, create a new user and update their role to 'instructor'.

-- 1. Create sample courses (Assumes an instructor exists. If not, you may need to update a profile role first)
-- For this seed to work without errors, ensure at least one profile exists or insert a dummy one if foreign key checks allow, 
-- but since profiles reference auth.users, we can't easily seed a fake user without a real auth ID.
-- So we will create a function to seed courses for a specific user ID.

CREATE OR REPLACE FUNCTION public.seed_sample_courses(instructor_uuid UUID)
RETURNS void AS $$
BEGIN
  -- Update role to instructor
  UPDATE public.profiles SET role = 'instructor' WHERE id = instructor_uuid;

  -- Insert React Course
  INSERT INTO public.courses (instructor_id, title, description, category, difficulty, status, curriculum)
  VALUES (
    instructor_uuid,
    'React 완벽 가이드',
    'Hooks, Redux, Next.js까지 모던 React 개발의 모든 것을 배웁니다.',
    'Programming',
    'intermediate',
    'published',
    '{"modules": ["Introduction", "Hooks Deep Dive", "State Management", "Performance Optimization"]}'
  );

  -- Insert Python Course
  INSERT INTO public.courses (instructor_id, title, description, category, difficulty, status, curriculum)
  VALUES (
    instructor_uuid,
    '파이썬 데이터 분석 기초',
    'Pandas와 Matplotlib을 활용한 데이터 시각화 및 분석 입문',
    'Data Science',
    'beginner',
    'published',
    '{"modules": ["Python Basics", "NumPy & Pandas", "Data Visualization", "Mini Project"]}'
  );

  -- Insert UX Design Course
  INSERT INTO public.courses (instructor_id, title, description, category, difficulty, status, curriculum)
  VALUES (
    instructor_uuid,
    '실전 UX/UI 디자인 패턴',
    '사용자를 사로잡는 인터페이스 설계 원칙과 피그마 실습',
    'Design',
    'beginner',
    'published',
    '{"modules": ["UX Principles", "Figma Basics", "Wireframing", "Prototyping"]}'
  );
END;
$$ LANGUAGE plpgsql;

-- Usage instructions:
-- After running this migration, call the function with your user ID in SQL Editor:
-- SELECT public.seed_sample_courses('your-uuid-here');

