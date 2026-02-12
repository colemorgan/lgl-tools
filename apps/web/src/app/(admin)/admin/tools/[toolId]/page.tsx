import { ToolDetailView } from '@/components/admin/tool-detail-view';

export default async function ToolDetailPage({
  params,
}: {
  params: Promise<{ toolId: string }>;
}) {
  const { toolId } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <ToolDetailView toolId={toolId} />
    </div>
  );
}
