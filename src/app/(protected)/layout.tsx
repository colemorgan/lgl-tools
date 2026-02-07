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

  // Check if user has a billing client record
  const supabase = await createClient();
  const { data: billingClient } = await supabase
    .from('billing_clients')
    .select('id')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="min-h-screen flex flex-col">
      <Nav
        userName={profile?.full_name ?? null}
        userEmail={user.email ?? ''}
        isAdmin={profile?.role === 'admin'}
        isBillingClient={!!billingClient}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
