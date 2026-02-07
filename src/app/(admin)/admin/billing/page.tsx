import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BillingClientsTable } from '@/components/admin/billing-clients-table';
import { InviteClientDialog } from '@/components/admin/invite-client-dialog';

export default function AdminBillingPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Billing Clients</h1>
        <div className="flex gap-2">
          <InviteClientDialog />
          <Button asChild>
            <Link href="/admin/billing/new">New Client</Link>
          </Button>
        </div>
      </div>
      <BillingClientsTable />
    </div>
  );
}
