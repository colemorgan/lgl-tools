import { ToolCatalogTable } from '@/components/admin/tool-catalog-table';

export default function AdminToolsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Tool Catalog</h1>
      </div>
      <ToolCatalogTable />
    </div>
  );
}
