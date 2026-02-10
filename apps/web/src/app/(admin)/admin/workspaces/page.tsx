import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WorkspacesTable } from '@/components/admin/workspaces-table';

export default function AdminWorkspacesPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Workspaces</h1>
        <Button asChild>
          <Link href="/admin/workspaces/new">New Workspace</Link>
        </Button>
      </div>
      <WorkspacesTable />
    </div>
  );
}
