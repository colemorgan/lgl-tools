import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getUser, getProfile } from '@/lib/supabase/server';
import { hasActiveAccess } from '@/types';
import { tools } from '@/config/tools';
import { getWorkspaceContext, needsPaymentSetup } from '@/lib/workspace';
import { TrialBanner } from '@/components/dashboard/trial-banner';
import { ToolCard } from '@/components/dashboard/tool-card';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CreateWorkspaceDialog } from '@/components/workspace/create-workspace-dialog';

export const metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  const wsContext = await getWorkspaceContext(user.id);
  const showPaymentSetupBanner = needsPaymentSetup(wsContext);

  const isManaged = wsContext?.workspaceType === 'managed';

  const accessGranted = isManaged ? true : hasActiveAccess(profile);

  // Filter tools for managed workspace users
  const visibleTools = isManaged
    ? tools.filter((tool) => wsContext.enabledTools.includes(tool.slug))
    : tools;

  const greeting = profile.full_name
    ? `Welcome back, ${profile.full_name.split(' ')[0]}`
    : 'Welcome back';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-muted-foreground mt-1">
            {isManaged
              ? wsContext.workspaceName
              : 'Access your tools and manage your workspace'}
          </p>
        </div>

        {showPaymentSetupBanner && (
          <Card className="border-amber-200 bg-amber-50">
            <CardHeader>
              <CardTitle className="text-lg text-amber-900">Payment Method Required</CardTitle>
              <CardDescription className="text-amber-800">
                Add a payment method to activate your workspace and access all your
                tools.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/billing?setup_required=true">
                <Button size="sm">Set Up Payment</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {!isManaged && <TrialBanner profile={profile} />}

        {!isManaged && !wsContext && profile.subscription_status === 'active' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unlock Metered Tools</CardTitle>
              <CardDescription>
                Create a workspace to access live streaming and other metered
                tools, and invite your team.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateWorkspaceDialog />
            </CardContent>
          </Card>
        )}

        <section>
          <h2 className="font-heading text-xl font-semibold mb-4">Your Tools</h2>
          {visibleTools.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Tools Available</CardTitle>
                <CardDescription>
                  Your workspace doesn&apos;t have any tools enabled yet. Contact your
                  workspace administrator to enable tools.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleTools.map((tool) => {
                const toolAccess = accessGranted && !(
                  !isManaged &&
                  profile.subscription_status === 'trialing' &&
                  tool.metered
                );
                return (
                  <ToolCard key={tool.slug} tool={tool} hasAccess={toolAccess} />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
