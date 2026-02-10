import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/supabase/server';
import { hasActiveAccess, hasWorkspaceAccess } from '@/types';
import { SubscriptionGate } from '@/components/tools/subscription-gate';
import { ToolHeader } from '@/components/tools/tool-header';

export default async function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  const accessGranted = hasActiveAccess(profile);

  if (!accessGranted) {
    // Check if user belongs to an active managed workspace
    const workspaceAccess = await hasWorkspaceAccess(user.id);
    if (!workspaceAccess) {
      return <SubscriptionGate profile={profile} />;
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ToolHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
