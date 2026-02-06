import { CreateBillingClientForm } from '@/components/admin/create-billing-client-form';

export default function NewBillingClientPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-heading font-bold mb-6">New Billing Client</h1>
      <CreateBillingClientForm />
    </div>
  );
}
