import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BillingClientsTable } from '@/components/admin/billing-clients-table';

export default function AdminBillingPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Billing Clients</h1>
        <Button asChild>
          <Link href="/admin/billing/new">New Client</Link>
        </Button>
      </div>
      <BillingClientsTable />
    </div>
  );
}
