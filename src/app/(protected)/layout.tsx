import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/supabase/server';
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

  return (
    <div className="min-h-screen flex flex-col">
      <Nav
        userName={profile?.full_name ?? null}
        userEmail={user.email ?? ''}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
