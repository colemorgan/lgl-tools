import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { BillingView } from '@/components/dashboard/billing-view';

export const metadata = {
  title: 'Billing',
};

export default async function BillingPage() {
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

  // Managed user (non-owner) cannot access billing
  if (isManaged && wsContext.memberRole !== 'owner') {
    redirect('/dashboard');
  }

  const isWorkspaceOwner = isManaged && wsContext.memberRole === 'owner';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1">
            View your upcoming bills and invoice history
          </p>
        </div>

        <BillingView isWorkspaceOwner={isWorkspaceOwner} />
      </div>
    </div>
  );
}
