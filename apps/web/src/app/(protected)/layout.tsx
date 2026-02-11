import { redirect } from 'next/navigation';
import { getUser, getProfile, createClient } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { Nav } from '@/components/dashboard/nav';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile();
  const wsContext = await getWorkspaceContext(user.id);

  const isManaged = wsContext?.workspaceType === 'managed';
  const isManagedOwner = isManaged && wsContext.memberRole === 'owner';

  // Determine billing client visibility:
  // - Managed owners can see billing
  // - Non-managed workspace members with billing_client_id can see billing
  // - Legacy billing_clients.user_id users can see billing
  let isBillingClient = !!wsContext?.billingClientId;

  if (!isBillingClient) {
    const supabase = await createClient();
    const { data: directClient } = await supabase
      .from('billing_clients')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    isBillingClient = !!directClient;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Nav
        userName={profile?.full_name ?? null}
        userEmail={user.email ?? ''}
        isAdmin={profile?.role === 'admin'}
        isBillingClient={isBillingClient}
        isManaged={isManaged}
        isManagedOwner={isManagedOwner}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
