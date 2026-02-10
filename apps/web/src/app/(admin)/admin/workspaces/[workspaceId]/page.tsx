import { WorkspaceDetailView } from '@/components/admin/workspace-detail';

export default async function WorkspaceDetailPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <WorkspaceDetailView workspaceId={workspaceId} />
    </div>
  );
}
