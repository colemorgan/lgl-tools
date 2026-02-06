-- Add Stripe Invoice fields to scheduled_charges
-- Used when charges are processed via Stripe Invoices (cron/manual trigger)
ALTER TABLE public.scheduled_charges
  ADD COLUMN stripe_invoice_id TEXT,
  ADD COLUMN stripe_invoice_url TEXT;
