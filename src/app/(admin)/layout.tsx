import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/supabase/server';
import { isAdmin } from '@/types/database';
import { AdminNav } from '@/components/admin/admin-nav';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile();

  if (!profile || !isAdmin(profile)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminNav
        userName={profile.full_name}
        userEmail={user.email ?? ''}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
