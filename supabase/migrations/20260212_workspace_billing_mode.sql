-- Add billing mode columns to workspaces table
-- collection_method: 'charge_automatically' (default, existing behavior) or 'send_invoice' (ACH/bank transfer)
-- allowed_payment_methods: JSON array of payment method types to accept
-- days_until_due: net terms in days when using send_invoice mode (default 30)

ALTER TABLE public.workspaces
  ADD COLUMN collection_method TEXT NOT NULL DEFAULT 'charge_automatically'
    CHECK (collection_method IN ('charge_automatically', 'send_invoice')),
  ADD COLUMN allowed_payment_methods JSONB NOT NULL DEFAULT '["card"]'::jsonb,
  ADD COLUMN days_until_due INTEGER NOT NULL DEFAULT 30
    CHECK (days_until_due > 0 AND days_until_due <= 365);
