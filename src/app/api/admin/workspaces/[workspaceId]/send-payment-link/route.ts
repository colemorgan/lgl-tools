import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { workspaceId } = await params;
    const supabase = createAdminClient();

    // Get workspace → billing_client_id
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('billing_client_id')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace?.billing_client_id) {
      return NextResponse.json({ error: 'Workspace not found or has no billing client' }, { status: 404 });
    }

    // Get billing client
    const { data: client, error: clientError } = await supabase
      .from('billing_clients')
      .select('*')
      .eq('id', workspace.billing_client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Billing client not found' }, { status: 404 });
    }

    if (!client.stripe_customer_id) {
      return NextResponse.json({ error: 'No Stripe customer linked' }, { status: 400 });
    }

    // Find the first pending charge
    const { data: charge, error: chargeError } = await supabase
      .from('scheduled_charges')
      .select('*')
      .eq('billing_client_id', workspace.billing_client_id)
      .eq('status', 'pending')
      .order('scheduled_date', { ascending: true })
      .limit(1)
      .single();

    if (chargeError || !charge) {
      return NextResponse.json({ error: 'No pending charges found' }, { status: 400 });
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: client.stripe_customer_id,
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: charge.currency,
            product_data: {
              name: charge.description || 'Custom charge',
            },
            unit_amount: charge.amount_cents,
          },
          quantity: 1,
        },
      ],
      payment_intent_data: {
        setup_future_usage: 'off_session',
        metadata: {
          billing_client_id: workspace.billing_client_id,
          scheduled_charge_id: charge.id,
          supabase_user_id: client.user_id,
        },
      },
      metadata: {
        billing_client_id: workspace.billing_client_id,
        scheduled_charge_id: charge.id,
        supabase_user_id: client.user_id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing_payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing_payment=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Admin workspace send payment link error:', error);
    return NextResponse.json({ error: 'Failed to create payment link' }, { status: 500 });
  }
}
