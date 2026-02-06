import { StatsCards } from '@/components/admin/stats-cards';

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-heading font-bold mb-6">Admin Dashboard</h1>
      <StatsCards />
    </div>
  );
}
