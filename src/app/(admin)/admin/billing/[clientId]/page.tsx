import { BillingClientDetailView } from '@/components/admin/billing-client-detail';

export default async function BillingClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  return (
    <div className="container mx-auto py-8 px-4">
      <BillingClientDetailView clientId={clientId} />
    </div>
  );
}
