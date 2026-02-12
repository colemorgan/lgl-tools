import { AdminUsageDashboard } from '@/components/admin/admin-usage-dashboard';

export default function AdminUsagePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Usage</h1>
      </div>
      <AdminUsageDashboard />
    </div>
  );
}
