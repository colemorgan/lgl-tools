import { redirect } from 'next/navigation';
import { getUser } from '@/lib/supabase/server';
import { getWorkspaceContext } from '@/lib/workspace';
import { TeamManagementView } from '@/components/workspace/team-management-view';

export const metadata = {
  title: 'Team',
};

export default async function TeamPage() {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const wsContext = await getWorkspaceContext(user.id);

  // Only managed workspace owners can access this page
  if (
    !wsContext ||
    wsContext.workspaceType !== 'managed' ||
    wsContext.memberRole !== 'owner'
  ) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Team</h1>
          <p className="text-muted-foreground mt-1">
            Manage your {wsContext.workspaceName} team members
          </p>
        </div>

        <TeamManagementView />
      </div>
    </div>
  );
}
