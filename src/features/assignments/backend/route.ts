import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { respond } from '@/backend/http/response';
import type { AppEnv } from '@/backend/hono/context';
import {
  createAssignment,
  getAssignmentsByCourse,
  createSubmission,
  getSubmissionsByAssignment,
  gradeSubmission,
  updateAssignmentStatus,
} from './service';
import {
  CreateAssignmentInputSchema,
  CreateSubmissionInputSchema,
  GradeSubmissionInputSchema,
  UpdateAssignmentStatusInputSchema,
} from './schema';

export const registerAssignmentsRoutes = (app: Hono<AppEnv>) => {
  const basePath = '/api/assignments';

  // 과제 생성 (강사)
  app.post(
    basePath,
    zValidator('json', CreateAssignmentInputSchema),
    async (c) => {
      const input = c.req.valid('json');
      const supabase = c.get('supabase');
      // TODO: Permission check (is instructor of course)
      const result = await createAssignment(supabase, input);
      return respond(c, result);
    }
  );

  // 특정 코스의 과제 목록 조회
  app.get(`${basePath}/course/:courseId`, async (c) => {
    const courseId = c.req.param('courseId');
    const supabase = c.get('supabase');
    const result = await getAssignmentsByCourse(supabase, courseId);
    return respond(c, result);
  });

  // 과제 제출 (학습자)
  app.post(
    `${basePath}/submit`,
    zValidator('json', CreateSubmissionInputSchema),
    async (c) => {
      const input = c.req.valid('json');
      const supabase = c.get('supabase');
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return c.json({ error: 'Unauthorized' }, 401);

      const result = await createSubmission(supabase, user.id, input);
      return respond(c, result);
    }
  );

  // 과제별 제출물 조회 (강사)
  app.get(`${basePath}/:id/submissions`, async (c) => {
    const id = c.req.param('id');
    const supabase = c.get('supabase');
    // TODO: Permission check
    const result = await getSubmissionsByAssignment(supabase, id);
    return respond(c, result);
  });

  // 채점 (강사)
  app.post(
    `${basePath}/submissions/:id/grade`,
    zValidator('json', GradeSubmissionInputSchema),
    async (c) => {
      const id = c.req.param('id');
      const input = c.req.valid('json');
      const supabase = c.get('supabase');
      const result = await gradeSubmission(supabase, id, input);
      return respond(c, result);
    }
  );

  // 과제 상태 전환 (게시/마감)
  app.patch(
    `${basePath}/:id/status`,
    zValidator('json', UpdateAssignmentStatusInputSchema),
    async (c) => {
      const id = c.req.param('id');
      const input = c.req.valid('json');
      const supabase = c.get('supabase');
      // TODO: Permission check (is instructor of course)
      const result = await updateAssignmentStatus(supabase, id, input);
      return respond(c, result);
    }
  );
};

