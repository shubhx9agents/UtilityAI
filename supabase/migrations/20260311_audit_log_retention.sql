-- Migration: Audit Log Retention Policy (SOC 2 CC7.4)
-- Adds is_archived flag, archival function, and optional pg_cron schedule.

-- ============================================================================
-- 1. Add is_archived column for efficient filtering
-- ============================================================================
ALTER TABLE audit_logs
    ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_audit_logs_is_archived
    ON audit_logs(is_archived);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at_not_archived
    ON audit_logs(created_at DESC) WHERE is_archived = FALSE;

-- ============================================================================
-- 2. RPC: archive_audit_logs
--    Sets is_archived = true and updates details JSONB for logs older than
--    the given cutoff. Returns the count of archived rows.
-- ============================================================================
CREATE OR REPLACE FUNCTION archive_audit_logs(cutoff_date TIMESTAMPTZ)
RETURNS INTEGER AS $$
DECLARE
    row_count INTEGER;
BEGIN
    UPDATE audit_logs
    SET
        is_archived = TRUE,
        details = COALESCE(details, '{}'::jsonb)
                  || jsonb_build_object('archived', true, 'archived_at', NOW()::text)
    WHERE created_at < cutoff_date
      AND is_archived = FALSE;

    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. RPC: purge_ancient_audit_logs
--    Deletes logs older than the given cutoff. Returns count of deleted rows.
-- ============================================================================
CREATE OR REPLACE FUNCTION purge_ancient_audit_logs(cutoff_date TIMESTAMPTZ)
RETURNS INTEGER AS $$
DECLARE
    row_count INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < cutoff_date;

    GET DIAGNOSTICS row_count = ROW_COUNT;
    RETURN row_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Admin RLS for delete (needed for purge via Supabase client)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'audit_logs' AND policyname = 'Admins can delete audit logs'
    ) THEN
        CREATE POLICY "Admins can delete audit logs"
            ON audit_logs FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================================
-- 5. Admin RLS for update (needed for archival via Supabase client)
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE tablename = 'audit_logs' AND policyname = 'Admins can update audit logs'
    ) THEN
        CREATE POLICY "Admins can update audit logs"
            ON audit_logs FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM user_roles
                    WHERE user_id = auth.uid() AND role = 'admin'
                )
            );
    END IF;
END $$;

-- ============================================================================
-- 6. Optional: pg_cron schedule (uncomment if pg_cron is available)
-- Runs daily at 03:00 UTC:
--   - Archive logs older than 90 days
--   - Purge logs older than 365 days
-- ============================================================================
-- SELECT cron.schedule(
--     'audit-log-archive',
--     '0 3 * * *',
--     $$ SELECT archive_audit_logs(NOW() - INTERVAL '90 days') $$
-- );
--
-- SELECT cron.schedule(
--     'audit-log-purge',
--     '0 3 * * *',
--     $$ SELECT purge_ancient_audit_logs(NOW() - INTERVAL '365 days') $$
-- );

COMMENT ON COLUMN audit_logs.is_archived IS 'Whether this log has been archived (older than active retention period)';
COMMENT ON FUNCTION archive_audit_logs IS 'Archives audit logs older than the given cutoff date by setting is_archived=true';
COMMENT ON FUNCTION purge_ancient_audit_logs IS 'Permanently deletes audit logs older than the given cutoff date';
