-- ============================================================================
-- FINAL FIX: Use a function to break the recursion
-- ============================================================================

-- Step 1: Create a function that checks admin status WITHOUT using RLS
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_roles.user_id = $1 AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop ALL existing policies
DROP POLICY IF EXISTS "Users can view own role" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON user_roles;

-- Step 3: Create new policies using the function
-- Users can always view their own role
CREATE POLICY "Users can view own role"
    ON user_roles FOR SELECT
    USING (auth.uid() = user_id);

-- Admins can view all roles (using the function)
CREATE POLICY "Admins can view all roles"
    ON user_roles FOR SELECT
    USING (public.is_admin(auth.uid()));

-- Admins can update roles
CREATE POLICY "Admins can update roles"
    ON user_roles FOR UPDATE
    USING (public.is_admin(auth.uid()));

-- Admins can insert roles
CREATE POLICY "Admins can insert roles"
    ON user_roles FOR INSERT
    WITH CHECK (public.is_admin(auth.uid()));

-- Step 4: Test it
SELECT public.is_admin(
    (SELECT id FROM auth.users WHERE email = 'shubhx9agents@gmail.com')
);
-- Should return: true

-- Step 5: Verify you can query your role
SELECT role FROM user_roles WHERE user_id = auth.uid();
