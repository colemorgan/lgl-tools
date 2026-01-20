import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Profile } from '@/types';

interface SubscriptionGateProps {
  profile: Profile;
}

export function SubscriptionGate({ profile }: SubscriptionGateProps) {
  const { subscription_status } = profile;

  if (subscription_status === 'past_due') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Payment Issue</CardTitle>
            <CardDescription>
              There was a problem with your last payment. Please update your
              payment method to continue using ZenFlow tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild>
              <Link href="/api/create-portal">Update Payment Method</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <CardTitle>Upgrade to Continue</CardTitle>
          <CardDescription>
            Your free trial has ended. Upgrade to ZenFlow Pro to continue using
            all tools.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button asChild>
            <Link href="/api/create-checkout">Upgrade to Pro</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">Back to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
