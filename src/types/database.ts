export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'expired_trial';

export interface Profile {
  id: string;
  full_name: string | null;
  subscription_status: SubscriptionStatus;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
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
