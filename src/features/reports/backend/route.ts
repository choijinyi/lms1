import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabase, getLogger, getUserId } from '@/backend/hono/context';
import { respond } from '@/backend/http/response';
import { withOperatorGuard } from '@/backend/middleware/operator-guard';
import {
  CreateReportSchema,
  ReportsQuerySchema,
  UpdateReportStatusSchema,
  ExecuteReportActionSchema,
} from './schema';
import {
  getReports,
  getReportById,
  createReport,
  updateReportStatus,
  executeReportAction,
} from './service';

export const registerReportsRoutes = (app: Hono<AppEnv>) => {
  /**
   * GET /api/reports
   * 신고 목록 조회 (Operator 전용)
   */
  app.get('/api/reports', withOperatorGuard(), async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // 쿼리 파라미터 검증
    const queryParse = ReportsQuerySchema.safeParse({
      status: c.req.query('status'),
      targetType: c.req.query('targetType'),
      page: c.req.query('page'),
      limit: c.req.query('limit'),
    });

    if (!queryParse.success) {
      logger.warn('Invalid query parameters', queryParse.error.format());
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: 'INVALID_QUERY',
          message: 'Invalid query parameters',
          details: queryParse.error.format(),
        },
      });
    }

    const result = await getReports(supabase, queryParse.data);

    return respond(c, result);
  });

  /**
   * GET /api/reports/:id
   * 신고 상세 조회 (Operator 전용)
   */
  app.get('/api/reports/:id', withOperatorGuard(), async (c) => {
    const supabase = getSupabase(c);
    const reportId = c.req.param('id');

    const result = await getReportById(supabase, reportId);

    return respond(c, result);
  });

  /**
   * POST /api/reports
   * 신고 생성 (일반 사용자용, 인증 필요)
   */
  app.post('/api/reports', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized report creation attempt', authError?.message);
      return c.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: 'Unauthorized',
          },
        },
        401,
      );
    }

    // 요청 본문 검증
    const body = await c.req.json();
    const bodyParse = CreateReportSchema.safeParse(body);

    if (!bodyParse.success) {
      logger.warn('Invalid request body', bodyParse.error.format());
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request body',
          details: bodyParse.error.format(),
        },
      });
    }

    const result = await createReport(supabase, user.id, bodyParse.data);

    return respond(c, result);
  });

  /**
   * PATCH /api/reports/:id/status
   * 신고 상태 변경 (Operator 전용)
   */
  app.patch('/api/reports/:id/status', withOperatorGuard(), async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const reportId = c.req.param('id');
    const operatorId = getUserId(c);

    if (!operatorId) {
      logger.error('Operator ID not found in context');
      return c.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Operator ID not found',
          },
        },
        500,
      );
    }

    // 요청 본문 검증
    const body = await c.req.json();
    const bodyParse = UpdateReportStatusSchema.safeParse(body);

    if (!bodyParse.success) {
      logger.warn('Invalid request body', bodyParse.error.format());
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request body',
          details: bodyParse.error.format(),
        },
      });
    }

    const result = await updateReportStatus(supabase, reportId, operatorId, bodyParse.data);

    return respond(c, result);
  });

  /**
   * POST /api/reports/:id/actions
   * 신고 액션 실행 (Operator 전용)
   */
  app.post('/api/reports/:id/actions', withOperatorGuard(), async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const reportId = c.req.param('id');
    const operatorId = getUserId(c);

    if (!operatorId) {
      logger.error('Operator ID not found in context');
      return c.json(
        {
          error: {
            code: 'INTERNAL_ERROR',
            message: 'Operator ID not found',
          },
        },
        500,
      );
    }

    // 요청 본문 검증
    const body = await c.req.json();
    const bodyParse = ExecuteReportActionSchema.safeParse(body);

    if (!bodyParse.success) {
      logger.warn('Invalid request body', bodyParse.error.format());
      return respond(c, {
        ok: false,
        status: 400,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Invalid request body',
          details: bodyParse.error.format(),
        },
      });
    }

    const result = await executeReportAction(supabase, reportId, operatorId, bodyParse.data);

    return respond(c, result);
  });
};
