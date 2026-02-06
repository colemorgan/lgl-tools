-- Add role column to profiles
ALTER TABLE public.profiles
  ADD COLUMN role TEXT NOT NULL DEFAULT 'user'
  CHECK (role IN ('user', 'admin'));

-- Create billing_clients table
CREATE TABLE public.billing_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  notes TEXT,
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending_setup'
    CHECK (status IN ('pending_setup', 'active', 'paused', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT billing_clients_user_id_unique UNIQUE (user_id)
);

-- Create scheduled_charges table
CREATE TABLE public.scheduled_charges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  billing_client_id UUID NOT NULL REFERENCES public.billing_clients(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  description TEXT,
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
  stripe_payment_intent_id TEXT,
  failure_reason TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for cron efficiency
CREATE INDEX idx_scheduled_charges_pending
  ON public.scheduled_charges (scheduled_date, status)
  WHERE status = 'pending';

-- Auto-update triggers for updated_at
CREATE TRIGGER set_billing_clients_updated_at
  BEFORE UPDATE ON public.billing_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_scheduled_charges_updated_at
  BEFORE UPDATE ON public.scheduled_charges
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.billing_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_charges ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only read their own records
CREATE POLICY "Users can view own billing client"
  ON public.billing_clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own scheduled charges"
  ON public.scheduled_charges FOR SELECT
  USING (
    billing_client_id IN (
      SELECT id FROM public.billing_clients WHERE user_id = auth.uid()
    )
  );
