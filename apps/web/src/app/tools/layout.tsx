import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getUser, getProfile } from '@/lib/supabase/server';
import { hasActiveAccess } from '@/types';
import { getWorkspaceContext } from '@/lib/workspace';
import { SubscriptionGate } from '@/components/tools/subscription-gate';
import { WorkspaceSuspendedGate } from '@/components/tools/workspace-suspended-gate';
import { MeteredToolGate } from '@/components/tools/metered-tool-gate';
import { ToolHeader } from '@/components/tools/tool-header';
import { getToolBySlug } from '@/config/tools';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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

  const wsContext = await getWorkspaceContext(user.id);
  const isManaged = wsContext?.workspaceType === 'managed';

  // Extract tool slug from pathname (shared by both branches)
  const headerList = await headers();
  const pathname = headerList.get('x-next-pathname') || '';
  const toolSlug = pathname.replace('/tools/', '').split('/')[0];

  if (isManaged) {
    // Managed workspace: check workspace status
    if (wsContext.workspaceStatus === 'suspended') {
      return <WorkspaceSuspendedGate />;
    }

    if (toolSlug && !wsContext.enabledTools.includes(toolSlug)) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle>Tool Not Available</CardTitle>
              <CardDescription>
                This tool is not enabled for your workspace. Contact your
                workspace administrator to request access.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Button asChild variant="outline">
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  } else {
    // Individual subscription check
    const accessGranted = hasActiveAccess(profile);
    if (!accessGranted) {
      return <SubscriptionGate profile={profile} />;
    }

    // Gate metered tools for trialing users (non-managed)
    if (profile.subscription_status === 'trialing') {
      const tool = toolSlug ? getToolBySlug(toolSlug) : undefined;
      if (tool?.metered) {
        return <MeteredToolGate />;
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ToolHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
