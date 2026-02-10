import { UserDetailCard } from '@/components/admin/user-detail-card';

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <UserDetailCard userId={userId} />
    </div>
  );
}
