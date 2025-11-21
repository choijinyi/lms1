import type { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { getSupabase, getLogger } from '@/backend/hono/context';
import { respond } from '@/backend/http/response';
import { withOperatorGuard } from '@/backend/middleware/operator-guard';
import {
  MetadataTypeSchema,
  CreateMetadataSchema,
  UpdateMetadataSchema,
} from './schema';
import {
  getMetadataList,
  createMetadata,
  updateMetadata,
  deleteMetadata,
} from './service';

export const registerMetadataRoutes = (app: Hono<AppEnv>) => {
  /**
   * GET /api/metadata/:type
   * 메타데이터 목록 조회 (Operator 전용)
   * type: categories | difficulties
   */
  app.get('/api/metadata/:type', withOperatorGuard(), async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const type = c.req.param('type');

    // 타입 검증
    const typeParse = MetadataTypeSchema.safeParse(type);

    if (!typeParse.success) {
      logger.warn('Invalid metadata type', { type });
      return c.json(
        {
          error: {
            code: 'INVALID_METADATA_TYPE',
            message: 'Invalid metadata type. Must be "categories" or "difficulties".',
          },
        },
        400,
      );
    }

    const result = await getMetadataList(supabase, typeParse.data);

    return respond(c, result);
  });

  /**
   * POST /api/metadata/:type
   * 메타데이터 생성 (Operator 전용)
   */
  app.post('/api/metadata/:type', withOperatorGuard(), async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const type = c.req.param('type');

    // 타입 검증
    const typeParse = MetadataTypeSchema.safeParse(type);

    if (!typeParse.success) {
      logger.warn('Invalid metadata type', { type });
      return c.json(
        {
          error: {
            code: 'INVALID_METADATA_TYPE',
            message: 'Invalid metadata type. Must be "categories" or "difficulties".',
          },
        },
        400,
      );
    }

    // 요청 본문 검증
    const body = await c.req.json();
    const bodyParse = CreateMetadataSchema.safeParse(body);

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

    const result = await createMetadata(supabase, typeParse.data, bodyParse.data);

    return respond(c, result);
  });

  /**
   * PATCH /api/metadata/:type/:id
   * 메타데이터 수정 (Operator 전용)
   */
  app.patch('/api/metadata/:type/:id', withOperatorGuard(), async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const type = c.req.param('type');
    const id = c.req.param('id');

    // 타입 검증
    const typeParse = MetadataTypeSchema.safeParse(type);

    if (!typeParse.success) {
      logger.warn('Invalid metadata type', { type });
      return c.json(
        {
          error: {
            code: 'INVALID_METADATA_TYPE',
            message: 'Invalid metadata type. Must be "categories" or "difficulties".',
          },
        },
        400,
      );
    }

    // 요청 본문 검증
    const body = await c.req.json();
    const bodyParse = UpdateMetadataSchema.safeParse(body);

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

    const result = await updateMetadata(supabase, typeParse.data, id, bodyParse.data);

    return respond(c, result);
  });

  /**
   * DELETE /api/metadata/:type/:id
   * 메타데이터 삭제 (Operator 전용)
   */
  app.delete('/api/metadata/:type/:id', withOperatorGuard(), async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const type = c.req.param('type');
    const id = c.req.param('id');

    // 타입 검증
    const typeParse = MetadataTypeSchema.safeParse(type);

    if (!typeParse.success) {
      logger.warn('Invalid metadata type', { type });
      return c.json(
        {
          error: {
            code: 'INVALID_METADATA_TYPE',
            message: 'Invalid metadata type. Must be "categories" or "difficulties".',
          },
        },
        400,
      );
    }

    const result = await deleteMetadata(supabase, typeParse.data, id);

    return respond(c, result);
  });
};
