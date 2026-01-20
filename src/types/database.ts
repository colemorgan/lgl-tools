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

export function hasActiveAccess(profile: Profile | null): boolean {
  if (!profile) return false;

  const status = profile.subscription_status;

  if (status === 'active') return true;

  if (status === 'trialing') {
    const trialEnds = new Date(profile.trial_ends_at);
    return trialEnds > new Date();
  }

  return false;
}
