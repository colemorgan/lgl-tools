import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { hasActiveAccess } from '@/types';
import { tools } from '@/config/tools';
import { TrialBanner } from '@/components/dashboard/trial-banner';
import { ToolCard } from '@/components/dashboard/tool-card';

export const metadata = {
  title: 'Dashboard',
};

export default async function DashboardPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  const accessGranted = hasActiveAccess(profile);
  const greeting = profile.full_name
    ? `Welcome back, ${profile.full_name.split(' ')[0]}`
    : 'Welcome back';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">{greeting}</h1>
          <p className="text-muted-foreground mt-1">
            Access your tools and manage your workspace
          </p>
        </div>

        <TrialBanner profile={profile} />

        <section>
          <h2 className="font-heading text-xl font-semibold mb-4">Your Tools</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} hasAccess={accessGranted} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
