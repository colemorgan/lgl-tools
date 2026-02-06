import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string; chargeId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { clientId, chargeId } = await params;
    const supabase = createAdminClient();

    // Get billing client
    const { data: client, error: clientError } = await supabase
      .from('billing_clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Billing client not found' }, { status: 404 });
    }

    if (!client.stripe_customer_id || !client.stripe_payment_method_id) {
      return NextResponse.json({ error: 'Client has no saved payment method' }, { status: 400 });
    }

    // Get charge
    const { data: charge, error: chargeError } = await supabase
      .from('scheduled_charges')
      .select('*')
      .eq('id', chargeId)
      .eq('billing_client_id', clientId)
      .single();

    if (chargeError || !charge) {
      return NextResponse.json({ error: 'Charge not found' }, { status: 404 });
    }

    if (charge.status !== 'pending') {
      return NextResponse.json({ error: 'Charge is not pending' }, { status: 400 });
    }

    // Mark as processing
    await supabase
      .from('scheduled_charges')
      .update({ status: 'processing' })
      .eq('id', chargeId);

    try {
      // Create a Stripe Invoice for professional invoicing
      await stripe.invoiceItems.create({
        customer: client.stripe_customer_id,
        amount: charge.amount_cents,
        currency: charge.currency,
        description: charge.description || 'Scheduled charge',
      });

      const invoice = await stripe.invoices.create({
        customer: client.stripe_customer_id,
        default_payment_method: client.stripe_payment_method_id,
        auto_advance: true,
        collection_method: 'charge_automatically',
        metadata: {
          billing_client_id: clientId,
          scheduled_charge_id: chargeId,
          supabase_user_id: client.user_id,
        },
      });

      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
      const paidInvoice = await stripe.invoices.pay(finalizedInvoice.id, {
        payment_method: client.stripe_payment_method_id!,
      });

      await supabase
        .from('scheduled_charges')
        .update({
          status: 'succeeded',
          stripe_invoice_id: paidInvoice.id,
          stripe_invoice_url: paidInvoice.hosted_invoice_url,
          processed_at: new Date().toISOString(),
        })
        .eq('id', chargeId);

      return NextResponse.json({
        success: true,
        invoice_id: paidInvoice.id,
      });
    } catch (stripeError) {
      const errorMessage = stripeError instanceof Error ? stripeError.message : 'Payment failed';

      await supabase
        .from('scheduled_charges')
        .update({
          status: 'failed',
          failure_reason: errorMessage,
          processed_at: new Date().toISOString(),
        })
        .eq('id', chargeId);

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  } catch (error) {
    console.error('Admin trigger charge error:', error);
    return NextResponse.json({ error: 'Failed to trigger charge' }, { status: 500 });
  }
}
