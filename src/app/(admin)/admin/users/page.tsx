import { UsersTable } from '@/components/admin/users-table';

export default function AdminUsersPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-heading font-bold mb-6">User Management</h1>
      <UsersTable />
    </div>
  );
}
