-- Add Stripe Invoice fields to scheduled_charges
-- stripe_invoice_url = hosted invoice page, stripe_invoice_pdf = direct PDF download
-- For Checkout-based first charges, stripe_invoice_url stores the receipt URL
ALTER TABLE public.scheduled_charges
  ADD COLUMN stripe_invoice_id TEXT,
  ADD COLUMN stripe_invoice_url TEXT,
  ADD COLUMN stripe_invoice_pdf TEXT;
