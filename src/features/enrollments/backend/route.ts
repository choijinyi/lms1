import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { respond } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';
import {
  createEnrollment,
  getMyEnrollments,
  cancelEnrollment,
} from './service';
import {
  CreateEnrollmentInputSchema,
  EnrollmentsQuerySchema,
} from './schema';

export const registerEnrollmentsRoutes = (app: Hono<AppEnv>) => {
  const basePath = '/api/enrollments';

  // 수강 신청
  app.post(
    basePath,
    zValidator('json', CreateEnrollmentInputSchema),
    async (c) => {
      const input = c.req.valid('json');
      const supabase = c.get('supabase');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const result = await createEnrollment(supabase, user.id, input);
      return respond(c, result);
    }
  );

  // 내 수강 목록 조회
  app.get(
    `${basePath}/my`,
    zValidator('query', EnrollmentsQuerySchema),
    async (c) => {
      const query = c.req.valid('query');
      const supabase = c.get('supabase');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const result = await getMyEnrollments(supabase, user.id, query);
      return respond(c, result);
    }
  );

  // 수강 취소
  app.patch(
    `${basePath}/:enrollmentId/cancel`,
    async (c) => {
      const enrollmentId = c.req.param('enrollmentId');
      const supabase = c.get('supabase');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
      }

      const result = await cancelEnrollment(supabase, user.id, enrollmentId);
      return respond(c, result);
    }
  );
};

