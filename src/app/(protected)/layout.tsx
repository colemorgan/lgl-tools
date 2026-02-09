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

  // Check if user is a workspace member (replaces billing_clients.user_id check)
  const supabase = await createClient();
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id, workspaces!inner(status, type)')
    .eq('user_id', user.id)
    .eq('workspaces.status', 'active')
    .limit(1);

  const isBillingClient = (membership?.length ?? 0) > 0;

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
