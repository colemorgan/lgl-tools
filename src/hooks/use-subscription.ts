'use client';

import { useMemo } from 'react';
import type { Profile, SubscriptionStatus } from '@/types';

interface SubscriptionState {
  status: SubscriptionStatus | null;
  hasAccess: boolean;
  daysRemaining: number | null;
  isTrialing: boolean;
  isActive: boolean;
  isPastDue: boolean;
  isExpired: boolean;
}

export function useSubscription(profile: Profile | null): SubscriptionState {
  return useMemo(() => {
    if (!profile) {
      return {
        status: null,
        hasAccess: false,
        daysRemaining: null,
        isTrialing: false,
        isActive: false,
        isPastDue: false,
        isExpired: false,
      };
    }

    const { subscription_status, trial_ends_at } = profile;
    const trialEnds = new Date(trial_ends_at);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    const isTrialing = subscription_status === 'trialing';
    const isActive = subscription_status === 'active';
    const isPastDue = subscription_status === 'past_due';
    const isExpired =
      subscription_status === 'expired_trial' ||
      subscription_status === 'canceled';

    const hasAccess =
      isActive || (isTrialing && daysRemaining > 0);

    return {
      status: subscription_status,
      hasAccess,
      daysRemaining: isTrialing ? Math.max(0, daysRemaining) : null,
      isTrialing,
      isActive,
      isPastDue,
      isExpired,
    };
  }, [profile]);
}
