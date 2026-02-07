import { redirect } from 'next/navigation';
import { getProfile } from '@/lib/supabase/server';
import { BillingView } from '@/components/dashboard/billing-view';

export const metadata = {
  title: 'Billing',
};

export default async function BillingPage() {
  const profile = await getProfile();

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground mt-1">
            View your upcoming bills and invoice history
          </p>
        </div>

        <BillingView />
      </div>
    </div>
  );
}
