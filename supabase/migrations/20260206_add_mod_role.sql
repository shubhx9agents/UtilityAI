-- Add Moderator Role Migration
-- Adds 'mod' role between 'user' and 'admin' for more granular access control

-- ============================================================================
-- UPDATE USER_ROLES TABLE
-- ============================================================================

-- Note: The user_roles table already has a VARCHAR role column that can accept 'mod'
-- We just need to verify the policies allow for the new role

-- ============================================================================
-- UPDATE PROFILES TABLE CONSTRAINT
-- ============================================================================

-- Drop existing constraint if exists and recreate with mod role
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
    CHECK (role IN ('user', 'mod', 'admin'));

-- ============================================================================
-- RLS POLICIES FOR MODERATORS
-- ============================================================================

-- Mods can view all user roles (but not admin users' roles)
CREATE POLICY "Mods can view non-admin roles"
    ON user_roles FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'mod'
        )
        AND role != 'admin'
    );

-- Mods can view audit logs (readonly access for monitoring)
CREATE POLICY "Mods can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'mod'
        )
    );

-- Mods can view all agent sessions (for support purposes)
CREATE POLICY "Mods can view all agent sessions"
    ON agent_sessions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_id = auth.uid() AND role = 'mod'
        )
    );

-- ============================================================================
-- HELPER FUNCTION FOR ROLE HIERARCHY
-- ============================================================================

-- Function to check if user has a role at or above a certain level
CREATE OR REPLACE FUNCTION has_role_level(required_role VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
    role_levels CONSTANT INTEGER[] := ARRAY[1, 2, 3]; -- user=1, mod=2, admin=3
    required_level INTEGER;
    user_level INTEGER;
BEGIN
    -- Get current user's role
    SELECT role INTO user_role
    FROM user_roles
    WHERE user_id = auth.uid();
    
    IF user_role IS NULL THEN
        user_role := 'user';
    END IF;
    
    -- Map roles to levels
    CASE user_role
        WHEN 'user' THEN user_level := 1;
        WHEN 'mod' THEN user_level := 2;
        WHEN 'admin' THEN user_level := 3;
        ELSE user_level := 1;
    END CASE;
    
    CASE required_role
        WHEN 'user' THEN required_level := 1;
        WHEN 'mod' THEN required_level := 2;
        WHEN 'admin' THEN required_level := 3;
        ELSE required_level := 1;
    END CASE;
    
    RETURN user_level >= required_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION has_role_level IS 'Check if current user has role at or above specified level (user < mod < admin)';

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- Role Hierarchy:
-- - user (level 1): Basic access, can only see own data
-- - mod (level 2): Can view all sessions and audit logs (support role)
-- - admin (level 3): Full access, can manage users and roles
--
-- To promote a user to mod, run:
-- UPDATE user_roles SET role = 'mod' WHERE user_id = 'USER_UUID_HERE';
--
