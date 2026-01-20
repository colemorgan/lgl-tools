import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/supabase/server';
import { AccountForm } from '@/components/dashboard/account-form';
import { SubscriptionCard } from '@/components/dashboard/subscription-card';

export const metadata = {
  title: 'Account',
};

export default async function AccountPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Account</h1>
          <p className="text-muted-foreground mt-1">
            Manage your profile and subscription
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AccountForm profile={profile} email={user.email ?? ''} />
          <SubscriptionCard profile={profile} />
        </div>
      </div>
    </div>
  );
}
