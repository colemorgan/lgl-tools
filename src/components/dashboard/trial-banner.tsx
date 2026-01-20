'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { Profile } from '@/types';

interface TrialBannerProps {
  profile: Profile;
}

export function TrialBanner({ profile }: TrialBannerProps) {
  const { subscription_status, trial_ends_at } = profile;

  if (subscription_status === 'active') {
    return null;
  }

  const trialEnds = new Date(trial_ends_at);
  const now = new Date();
  const daysRemaining = Math.ceil(
    (trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (subscription_status === 'expired_trial' || daysRemaining <= 0) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-destructive">Trial Expired</h3>
            <p className="text-sm text-muted-foreground">
              Your free trial has ended. Upgrade to continue using ZenFlow
              tools.
            </p>
          </div>
          <Button asChild>
            <Link href="/api/create-checkout">Upgrade Now</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (subscription_status === 'past_due') {
    return (
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-yellow-600">Payment Issue</h3>
            <p className="text-sm text-muted-foreground">
              There was a problem with your last payment. Please update your
              payment method.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/api/create-portal">Manage Billing</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (subscription_status === 'trialing') {
    const urgency = daysRemaining <= 3;

    return (
      <div
        className={`${
          urgency
            ? 'bg-yellow-500/10 border-yellow-500/20'
            : 'bg-primary/5 border-primary/10'
        } border rounded-lg p-4`}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold">
              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in your
              trial
            </h3>
            <p className="text-sm text-muted-foreground">
              {urgency
                ? 'Your trial is ending soon. Upgrade now to keep access to all tools.'
                : 'Enjoying ZenFlow? Upgrade anytime to continue after your trial.'}
            </p>
          </div>
          <Button asChild variant={urgency ? 'default' : 'outline'}>
            <Link href="/api/create-checkout">
              {urgency ? 'Upgrade Now' : 'View Plans'}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
