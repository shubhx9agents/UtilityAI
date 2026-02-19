-- ============================================================
-- Credit & Quota Enforcement System
-- Migration: 20260219_credit_quota.sql
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. user_usage — one row per user, mutable counters
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_usage (
  user_id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_credits_used   INTEGER NOT NULL DEFAULT 0 CHECK (total_credits_used >= 0),
  canvas_creations_used INTEGER NOT NULL DEFAULT 0 CHECK (canvas_creations_used >= 0),
  per_agent_credits    JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- 2. credit_transactions — append-only audit log
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.credit_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type        TEXT,
  action            TEXT NOT NULL CHECK (action IN ('agent_run', 'canvas_create', 'canvas_orchestrate', 'agent_chat')),
  credits_consumed  INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_usage_user_id ON public.user_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON public.credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON public.credit_transactions(created_at DESC);

-- ─────────────────────────────────────────────
-- 3. Row Level Security
-- ─────────────────────────────────────────────
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own usage
CREATE POLICY "Users can view own usage"
  ON public.user_usage FOR SELECT
  USING (auth.uid() = user_id);

-- Users can read their own transaction history
CREATE POLICY "Users can view own transactions"
  ON public.credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all usage (read-only in admin panel)
CREATE POLICY "Admins can view all usage"
  ON public.user_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can view all transactions"
  ON public.credit_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ─────────────────────────────────────────────
-- 4. Atomic credit deduction RPC (SECURITY DEFINER bypasses RLS for writes)
--    Returns: { allowed: boolean, reason: text, updated_usage: jsonb }
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deduct_agent_credit(
  p_user_id       UUID,
  p_agent_type    TEXT,
  p_max_per_agent INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row         public.user_usage%ROWTYPE;
  v_agent_used  INTEGER;
BEGIN
  -- Lock the row (or create it) to prevent race conditions
  INSERT INTO public.user_usage (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_row
  FROM public.user_usage
  WHERE user_id = p_user_id
  FOR UPDATE;  -- exclusive row lock

  -- Get current per-agent usage
  v_agent_used := COALESCE((v_row.per_agent_credits ->> p_agent_type)::INTEGER, 0);

  -- Check limit
  IF v_agent_used >= p_max_per_agent THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'per_agent_limit_exceeded',
      'agent_type', p_agent_type,
      'used', v_agent_used,
      'limit', p_max_per_agent
    );
  END IF;

  -- Deduct
  UPDATE public.user_usage
  SET
    total_credits_used  = total_credits_used + 1,
    per_agent_credits   = jsonb_set(
                            per_agent_credits,
                            ARRAY[p_agent_type],
                            to_jsonb(v_agent_used + 1)
                          ),
    updated_at          = NOW()
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO public.credit_transactions (user_id, agent_type, action, credits_consumed)
  VALUES (p_user_id, p_agent_type, 'agent_run', 1);

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'ok',
    'agent_type', p_agent_type,
    'used', v_agent_used + 1,
    'limit', p_max_per_agent
  );
END;
$$;

-- ─────────────────────────────────────────────
-- 5. Atomic canvas creation deduction RPC
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deduct_canvas_credit(
  p_user_id   UUID,
  p_max_canvas INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.user_usage%ROWTYPE;
BEGIN
  INSERT INTO public.user_usage (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_row
  FROM public.user_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_row.canvas_creations_used >= p_max_canvas THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'canvas_limit_exceeded',
      'used', v_row.canvas_creations_used,
      'limit', p_max_canvas
    );
  END IF;

  UPDATE public.user_usage
  SET
    canvas_creations_used = canvas_creations_used + 1,
    total_credits_used    = total_credits_used + 1,
    updated_at            = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, agent_type, action, credits_consumed)
  VALUES (p_user_id, NULL, 'canvas_create', 1);

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'ok',
    'used', v_row.canvas_creations_used + 1,
    'limit', p_max_canvas
  );
END;
$$;

-- ─────────────────────────────────────────────
-- 6. Atomic canvas orchestrate deduction RPC (counts as agent credit)
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.deduct_orchestrate_credit(
  p_user_id       UUID,
  p_max_per_agent INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row        public.user_usage%ROWTYPE;
  v_agent_used INTEGER;
  v_agent_key  TEXT := 'canvas_orchestrate';
BEGIN
  INSERT INTO public.user_usage (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_row
  FROM public.user_usage
  WHERE user_id = p_user_id
  FOR UPDATE;

  v_agent_used := COALESCE((v_row.per_agent_credits ->> v_agent_key)::INTEGER, 0);

  IF v_agent_used >= p_max_per_agent THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'per_agent_limit_exceeded',
      'agent_type', v_agent_key,
      'used', v_agent_used,
      'limit', p_max_per_agent
    );
  END IF;

  UPDATE public.user_usage
  SET
    total_credits_used = total_credits_used + 1,
    per_agent_credits  = jsonb_set(
                           per_agent_credits,
                           ARRAY[v_agent_key],
                           to_jsonb(v_agent_used + 1)
                         ),
    updated_at         = NOW()
  WHERE user_id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, agent_type, action, credits_consumed)
  VALUES (p_user_id, v_agent_key, 'canvas_orchestrate', 1);

  RETURN jsonb_build_object(
    'allowed', true,
    'reason', 'ok',
    'agent_type', v_agent_key,
    'used', v_agent_used + 1,
    'limit', p_max_per_agent
  );
END;
$$;

-- ─────────────────────────────────────────────
-- 7. Grant execute on RPCs to authenticated users
--    (They still call through our API; this just allows supabase.rpc() to work)
-- ─────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION public.deduct_agent_credit TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_canvas_credit TO authenticated;
GRANT EXECUTE ON FUNCTION public.deduct_orchestrate_credit TO authenticated;
