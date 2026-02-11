import { redirect } from 'next/navigation';
import { getUser, getProfile } from '@/lib/supabase/server';
import { hasActiveAccess } from '@/types';
import { tools } from '@/config/tools';
import { getWorkspaceContext, needsPaymentSetup } from '@/lib/workspace';
import { TrialBanner } from '@/components/dashboard/trial-banner';
import { ToolCard } from '@/components/dashboard/tool-card';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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

  if (needsPaymentSetup(wsContext)) {
    redirect('/billing?setup_required=true');
  }

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

        {!isManaged && <TrialBanner profile={profile} />}

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
              {visibleTools.map((tool) => (
                <ToolCard key={tool.slug} tool={tool} hasAccess={accessGranted} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
