import { redirect } from 'next/navigation';
import { getUser, getProfile, createClient } from '@/lib/supabase/server';
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

  // Check if user is a workspace member or legacy billing client
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces!inner(status, type)')
    .eq('user_id', user.id)
    .eq('workspaces.status', 'active')
    .limit(1);

  let isBillingClient = (membership?.length ?? 0) > 0;

  // Fallback: check legacy billing_clients.user_id for unmigrated users
  if (!isBillingClient) {
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
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
