import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { getUser, getProfile } from '@/lib/supabase/server';
import { checkToolAccess } from '@/lib/tool-access';
import { SubscriptionGate } from '@/components/tools/subscription-gate';
import { WorkspaceSuspendedGate } from '@/components/tools/workspace-suspended-gate';
import { MeteredToolGate } from '@/components/tools/metered-tool-gate';
import { ToolHeader } from '@/components/tools/tool-header';
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

  // Extract tool slug from pathname
  const headerList = await headers();
  const pathname = headerList.get('x-next-pathname') || '';
  const toolSlug = pathname.replace('/tools/', '').split('/')[0];

  if (toolSlug) {
    const access = await checkToolAccess(toolSlug, profile, user.id);

    if (!access.allowed) {
      if (access.cta === 'subscribe') {
        return <SubscriptionGate profile={profile} />;
      }

      if (access.reason?.includes('suspended')) {
        return <WorkspaceSuspendedGate />;
      }

      if (access.cta === 'create_workspace') {
        return <MeteredToolGate />;
      }

      // Default: tool not available for workspace
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <CardTitle>Tool Not Available</CardTitle>
              <CardDescription>{access.reason}</CardDescription>
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
  }

  return (
    <div className="min-h-screen flex flex-col">
      <ToolHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
