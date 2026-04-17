-- Create account_requests table
CREATE TABLE IF NOT EXISTS public.account_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.account_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can insert a request
CREATE POLICY "Anyone can insert requests" ON public.account_requests 
  FOR INSERT WITH CHECK (true);

-- Admins can view and update requests
CREATE POLICY "Admins can view and update requests" ON public.account_requests 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create timestamp trigger
CREATE TRIGGER set_updated_at_account_requests
  BEFORE UPDATE ON public.account_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Index for finding requests by email
CREATE INDEX IF NOT EXISTS idx_account_requests_email ON public.account_requests(email);
