-- Allow billing_clients to exist without a user (for invite-based creation)
ALTER TABLE public.billing_clients
  ALTER COLUMN user_id DROP NOT NULL;

-- Create client_invites table
CREATE TABLE public.client_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_client_id UUID NOT NULL REFERENCES public.billing_clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  email TEXT,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast token lookups
CREATE INDEX idx_client_invites_token ON public.client_invites (token);

-- Auto-update trigger for updated_at
CREATE TRIGGER set_client_invites_updated_at
  BEFORE UPDATE ON public.client_invites
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.client_invites ENABLE ROW LEVEL SECURITY;

-- No user-facing RLS policies needed: invites are managed by admin (service role)
-- and validated via public API routes that use the admin client
