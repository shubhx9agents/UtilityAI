-- Add DELETE policy for audit_logs to allow admins to clear logs

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can delete audit logs" ON audit_logs;

-- Allow admins to delete audit logs
CREATE POLICY "Admins can delete audit logs"
    ON audit_logs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );
