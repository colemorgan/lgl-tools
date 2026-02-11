import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { AccountForm } from '@/components/dashboard/account-form';
import { SubscriptionCard } from '@/components/dashboard/subscription-card';
import { WorkspaceInfoCard } from '@/components/dashboard/workspace-info-card';

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

  const wsContext = await getWorkspaceContext(user.id);
  const isManaged = wsContext?.workspaceType === 'managed';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Account</h1>
          <p className="text-muted-foreground mt-1">
            {isManaged
              ? 'Manage your profile'
              : 'Manage your profile and subscription'}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AccountForm profile={profile} email={user.email ?? ''} />
          {isManaged ? (
            <WorkspaceInfoCard
              workspaceName={wsContext.workspaceName}
              memberRole={wsContext.memberRole}
            />
          ) : (
            <SubscriptionCard profile={profile} />
          )}
        </div>
      </div>
    </div>
  );
}
