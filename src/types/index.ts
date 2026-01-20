export type { SubscriptionStatus, Profile } from './database';
export { hasActiveAccess, getTrialDaysRemaining } from './database';

export interface Tool {
  slug: string;
  name: string;
  description: string;
  icon: string;
  status: 'available' | 'coming_soon';
}
