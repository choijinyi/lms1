-- Migration: add report_actions table for tracking report processing history

CREATE TABLE IF NOT EXISTS public.report_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  operator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'invalidate_submission', 'restrict_account', 'dismiss')),
  target_id UUID,
  memo TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.report_actions IS '신고 처리 액션 이력 (UC-012)';
COMMENT ON COLUMN public.report_actions.action_type IS '액션 유형: warning (경고), invalidate_submission (제출물 무효화), restrict_account (계정 제한), dismiss (기각)';
COMMENT ON COLUMN public.report_actions.target_id IS '액션 대상 ID (submission_id, user_id 등)';

CREATE INDEX IF NOT EXISTS idx_report_actions_report_id ON public.report_actions(report_id);
CREATE INDEX IF NOT EXISTS idx_report_actions_operator_id ON public.report_actions(operator_id);

DROP TRIGGER IF EXISTS update_report_actions_updated_at ON public.report_actions;
CREATE TRIGGER update_report_actions_updated_at
  BEFORE UPDATE ON public.report_actions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE IF EXISTS public.report_actions DISABLE ROW LEVEL SECURITY;
