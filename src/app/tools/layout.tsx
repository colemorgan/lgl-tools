import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/supabase/server';
import { hasActiveAccess } from '@/types';
import { SubscriptionGate } from '@/components/tools/subscription-gate';

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
    return <SubscriptionGate profile={profile} />;
  }

  return <>{children}</>;
}
