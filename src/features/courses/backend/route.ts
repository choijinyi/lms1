import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { respond } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';
import {
  getCourses,
  getCourseById,
  createCourse,
} from './service';
import {
  CoursesQuerySchema,
  CreateCourseInputSchema,
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

  // 생성 (보호된 라우트 예시 - 실제로는 미들웨어에서 유저 체크 필요)
  app.post(
    basePath,
    zValidator('json', CreateCourseInputSchema),
    async (c) => {
      const input = c.req.valid('json');
      const supabase = c.get('supabase');
      
      // TODO: 실제 유저 ID 가져오기 (현재는 context에서 가져와야 함)
      // 임시로 헤더나 세션에서 가져오는 로직이 필요하지만, 
      // 여기서는 Supabase auth.getUser()를 통해 확인 가능
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const result = await createCourse(supabase, user.id, input);
      return respond(c, result);
    }
  );
};

