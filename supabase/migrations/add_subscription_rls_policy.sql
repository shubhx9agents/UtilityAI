-- Migration: Allow authenticated users to update their own account_type
-- and ensure service-role can update account_type for admin revocation operations

-- Allow the authenticated user to update their own account_type
-- (used by /api/auth/upgrade which runs with the user's own session)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can update own account_type'
  ) THEN
    CREATE POLICY "Users can update own account_type"
      ON public.profiles FOR UPDATE
      USING (auth.uid() = id)
      WITH CHECK (auth.uid() = id);
  END IF;
END $$;

-- Note: The service role key (used in admin API routes) already bypasses RLS entirely,
-- so no additional policy is needed for admin revocation via service role client.
