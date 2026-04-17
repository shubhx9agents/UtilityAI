-- Create a function that runs bypassing RLS to check for admin status
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Fix the recursion in profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- Also fix account_requests if we used the same recursion pattern
DROP POLICY IF EXISTS "Admins can view and update requests" ON public.account_requests;
CREATE POLICY "Admins can view and update requests" 
  ON public.account_requests 
  FOR ALL USING (public.is_admin());
