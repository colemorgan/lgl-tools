import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Profile } from '@/types';

interface SubscriptionCardProps {
  profile: Profile;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  trialing: { label: 'Trial', variant: 'secondary' },
  active: { label: 'Active', variant: 'default' },
  past_due: { label: 'Past Due', variant: 'destructive' },
  canceled: { label: 'Canceled', variant: 'outline' },
  expired_trial: { label: 'Expired', variant: 'destructive' },
};

export function SubscriptionCard({ profile }: SubscriptionCardProps) {
  const { subscription_status, trial_ends_at, stripe_customer_id } = profile;
  const statusInfo = statusLabels[subscription_status] || {
    label: subscription_status,
    variant: 'outline' as const,
  };

  const trialEnds = new Date(trial_ends_at);
  const now = new Date();
  const daysRemaining = Math.ceil(
    (trialEnds.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Subscription</CardTitle>
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
        </div>
        <CardDescription>Manage your subscription and billing</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription_status === 'trialing' && daysRemaining > 0 && (
          <p className="text-sm">
            Your trial ends in{' '}
            <span className="font-semibold">
              {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
            </span>
          </p>
        )}

        {subscription_status === 'active' && (
          <p className="text-sm text-muted-foreground">
            You have full access to all ZenFlow tools.
          </p>
        )}

        {(subscription_status === 'expired_trial' ||
          subscription_status === 'canceled' ||
          (subscription_status === 'trialing' && daysRemaining <= 0)) && (
          <p className="text-sm text-muted-foreground">
            Upgrade to continue using ZenFlow tools.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          {subscription_status === 'active' && stripe_customer_id ? (
            <Button asChild variant="outline">
              <Link href="/api/create-portal">Manage Subscription</Link>
            </Button>
          ) : (
            <Button asChild>
              <Link href="/api/create-checkout">
                {subscription_status === 'trialing'
                  ? 'Upgrade to Pro'
                  : 'Subscribe to Pro'}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
