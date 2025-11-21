import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { respond } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
} from './service';
import {
  CoursesQuerySchema,
  CreateCourseInputSchema,
  CreateCourseByOperatorInputSchema,
  UpdateCourseInputSchema,
} from './schema';

export const registerCoursesRoutes = (app: Hono<AppEnv>) => {
  const basePath = '/api/courses';

  // 목록 조회
  app.get(
    basePath,
    zValidator('query', CoursesQuerySchema),
    async (c) => {
      const query = c.req.valid('query');
      const supabase = c.get('supabase');
      const result = await getCourses(supabase, query);
      return respond(c, result);
    }
  );

  // 상세 조회
  app.get(`${basePath}/:id`, async (c) => {
    const id = c.req.param('id');
    const supabase = c.get('supabase');
    const result = await getCourseById(supabase, id);
    return respond(c, result);
  });

  // 코스 생성 (강사/관리자)
  // 강사는 본인 ID로, 관리자는 입력받은 instructorId로 생성
  app.post(
    basePath,
    async (c) => {
      const supabase = c.get('supabase');
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      // 사용자의 역할 확인 (DB에서 확인 필요)
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      const role = profile?.role;

      if (role === 'operator') {
        // 관리자는 instructorId를 포함한 요청을 보냄
        const json = await c.req.json();
        const parsed = CreateCourseByOperatorInputSchema.safeParse(json);
        
        if (!parsed.success) {
          return c.json({ error: 'Invalid input', details: parsed.error.format() }, 400);
        }

        const { instructorId, ...input } = parsed.data;
        // 입력받은 instructorId가 유효한지(실제 강사인지) 체크하는 로직이 있으면 좋음
        const result = await createCourse(supabase, instructorId, input);
        return respond(c, result);

      } else if (role === 'instructor') {
        // 강사는 본인 ID 사용
        const json = await c.req.json();
        const parsed = CreateCourseInputSchema.safeParse(json);

        if (!parsed.success) {
          return c.json({ error: 'Invalid input', details: parsed.error.format() }, 400);
        }

        const result = await createCourse(supabase, user.id, parsed.data);
        return respond(c, result);
      } else {
        return c.json({ error: 'Forbidden' }, 403);
      }
    }
  );

  // 코스 수정 (강사만 가능)
  app.patch(
    `${basePath}/:id`,
    zValidator('json', UpdateCourseInputSchema),
    async (c) => {
      const id = c.req.param('id');
      const input = c.req.valid('json');
      const supabase = c.get('supabase');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const result = await updateCourse(supabase, id, user.id, input);
      return respond(c, result);
    }
  );
};
