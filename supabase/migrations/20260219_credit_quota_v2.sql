-- ============================================================
-- Credit & Quota Enforcement System — V2 (Aggregate Limits)
-- Migration: 20260219_credit_quota_v2.sql
--
-- RUN THIS AFTER: 20260219_credit_quota.sql
--
-- Changes:
--   1. Drop old per-agent and orchestrate RPC functions
--   2. Add deduct_agent_credit_v2 — aggregate total check only
--   3. Add pre_check_agent_credit  — read-only check (no deduction)
--   4. deduct_canvas_credit stays unchanged (already aggregate)
--   5. Revoke old grants; grant new ones
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Drop old RPC functions (replaced below)
-- ─────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.deduct_agent_credit(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.deduct_orchestrate_credit(UUID, INTEGER);

-- NOTE: deduct_canvas_credit(UUID, INTEGER) is KEPT — it is still correct.

-- ─────────────────────────────────────────────
-- 2. Pre-check function (read-only, no lock, no deduction)
--    Used by API routes to gate before attempting the AI call.
--    Returns { allowed: bool, reason: text, used: int, limit: int }
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.pre_check_agent_credit(
  p_user_id   UUID,
  p_max_total INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used INTEGER;
BEGIN
  SELECT COALESCE(total_credits_used, 0)
  INTO   v_used
  FROM   public.user_usage
  WHERE  user_id = p_user_id;

  -- No row yet means 0 used
  IF NOT FOUND THEN
    v_used := 0;
  END IF;

  IF v_used >= p_max_total THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason',  'total_output_limit_exceeded',
      'used',    v_used,
      'limit',   p_max_total
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'reason',  'ok',
    'used',    v_used,
    'limit',   p_max_total
  );
END;
$$;

-- ─────────────────────────────────────────────
-- 3. Deduct agent credit — aggregate only
--    Called AFTER a successful AI response.
--    Checks aggregate total again under a row lock (prevents double-spend)
--    and increments total_credits_used by 1.
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deduct_agent_credit_v2(
  p_user_id    UUID,
  p_agent_type TEXT,
  p_max_total  INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row  public.user_usage%ROWTYPE;
BEGIN
  -- Ensure row exists
  INSERT INTO public.user_usage (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  -- Lock row to prevent race conditions
  SELECT * INTO v_row
  FROM   public.user_usage
  WHERE  user_id = p_user_id
  FOR UPDATE;

  -- Re-check aggregate limit under lock
  IF v_row.total_credits_used >= p_max_total THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason',  'total_output_limit_exceeded',
      'used',    v_row.total_credits_used,
      'limit',   p_max_total
    );
  END IF;

  -- Increment aggregate counter only (no per-agent breakdown for enforcement)
  UPDATE public.user_usage
  SET
    total_credits_used = total_credits_used + 1,
    updated_at         = NOW()
  WHERE user_id = p_user_id;

  -- Audit log
  INSERT INTO public.credit_transactions (user_id, agent_type, action, credits_consumed)
  VALUES (p_user_id, p_agent_type, 'agent_run', 1);

  RETURN jsonb_build_object(
    'allowed', true,
    'reason',  'ok',
    'used',    v_row.total_credits_used + 1,
    'limit',   p_max_total
  );
END;
$$;

-- ─────────────────────────────────────────────
-- 4. Pre-check canvas credit (read-only)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.pre_check_canvas_credit(
  p_user_id    UUID,
  p_max_canvas INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_used INTEGER;
BEGIN
  SELECT COALESCE(canvas_creations_used, 0)
  INTO   v_used
  FROM   public.user_usage
  WHERE  user_id = p_user_id;

  IF NOT FOUND THEN
    v_used := 0;
  END IF;

  IF v_used >= p_max_canvas THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason',  'canvas_limit_exceeded',
      'used',    v_used,
      'limit',   p_max_canvas
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'reason',  'ok',
    'used',    v_used,
    'limit',   p_max_canvas
  );
END;
$$;

-- ─────────────────────────────────────────────
-- 5. Revoke old grants & grant new functions
-- ─────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.deduct_canvas_credit(UUID, INTEGER) FROM authenticated;

GRANT EXECUTE ON FUNCTION public.pre_check_agent_credit(UUID, INTEGER)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_agent_credit_v2(UUID, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pre_check_canvas_credit(UUID, INTEGER)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_canvas_credit(UUID, INTEGER)      TO authenticated;
