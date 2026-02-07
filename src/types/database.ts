export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired_trial';

export type UserRole = 'user' | 'admin';

export type BillingClientStatus = 'pending_setup' | 'active' | 'paused' | 'closed';

export type ChargeStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled';

export interface Profile {
  id: string;
  full_name: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface BillingClient {
  id: string;
  user_id: string | null;
  name: string;
  notes: string | null;
  stripe_customer_id: string | null;
  stripe_payment_method_id: string | null;
  status: BillingClientStatus;
  created_at: string;
  updated_at: string;
}

export interface ClientInvite {
  id: string;
  billing_client_id: string;
  token: string;
  email: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ScheduledCharge {
  id: string;
  billing_client_id: string;
  amount_cents: number;
  currency: string;
  description: string | null;
  scheduled_date: string;
  status: ChargeStatus;
  stripe_payment_intent_id: string | null;
  stripe_invoice_id: string | null;
  stripe_invoice_url: string | null;
  stripe_invoice_pdf: string | null;
  failure_reason: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function isAdmin(profile: Profile | null): boolean {
  return profile?.role === 'admin';
}

export function getTrialDaysRemaining(trialEndsAt: string): number {
  const trialEnds = new Date(trialEndsAt);
  const now = new Date();
  return Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export function hasActiveAccess(profile: Profile | null): boolean {
  if (!profile) return false;

  const status = profile.subscription_status;

  if (status === 'active') return true;

  if (status === 'trialing') {
    return getTrialDaysRemaining(profile.trial_ends_at) > 0;
  }

  return false;
}
