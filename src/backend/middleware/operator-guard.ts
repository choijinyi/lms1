import { createMiddleware } from 'hono/factory';
import type { AppEnv, AppContext } from '@/backend/hono/context';
import { getSupabase, getLogger, contextKeys } from '@/backend/hono/context';

/**
 * Operator 권한 검증 미들웨어
 *
 * @description
 * - Supabase Auth로 사용자 인증 확인
 * - profiles 테이블에서 role이 'operator'인지 검증
 * - 실패 시 401 (인증 실패) 또는 403 (권한 없음) 반환
 */
export const withOperatorGuard = () =>
  createMiddleware<AppEnv>(async (c: AppContext, next) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    // 1. 사용자 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      logger.warn('Unauthorized access to operator route', authError?.message);
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

    // 2. 사용자 역할 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile || profile.role !== 'operator') {
      logger.warn('Non-operator access attempt', { userId: user.id, role: profile?.role });
      return c.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'Access denied. Operator role required.',
          },
        },
        403,
      );
    }

    // 3. userId를 Context에 저장 (서비스 레이어에서 사용)
    c.set(contextKeys.userId, user.id);

    await next();
  });
