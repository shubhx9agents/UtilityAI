-- Add missing DELETE policy for onboarding_progress
CREATE POLICY "Users can delete own onboarding progress"
  ON public.onboarding_progress FOR DELETE
  USING (auth.uid() = user_id);
