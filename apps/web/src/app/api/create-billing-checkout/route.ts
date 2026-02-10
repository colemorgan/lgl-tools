import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL('/login', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const { searchParams } = request.nextUrl;
    const billingClientId = searchParams.get('billing_client_id');
    const chargeId = searchParams.get('charge_id');

    if (!billingClientId || !chargeId) {
      return NextResponse.json(
        { error: 'billing_client_id and charge_id are required' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // Verify access: check workspace membership first, then direct ownership
    const { data: wsMembership } = await supabaseAdmin
      .from('workspace_members')
      .select('workspace_id, workspaces!inner(billing_client_id)')
      .eq('user_id', user.id)
      .eq('workspaces.billing_client_id', billingClientId)
      .limit(1)
      .maybeSingle();

    let client;
    if (wsMembership) {
      const { data: c } = await supabaseAdmin
        .from('billing_clients')
        .select('*')
        .eq('id', billingClientId)
        .single();
      client = c;
    } else {
      // Fallback: direct billing_clients.user_id ownership
      const { data: c } = await supabaseAdmin
        .from('billing_clients')
        .select('*')
        .eq('id', billingClientId)
        .eq('user_id', user.id)
        .single();
      client = c;
    }

    if (!client) {
      return NextResponse.json(
        { error: 'Billing client not found or access denied' },
        { status: 404 }
      );
    }

    if (!client.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer linked' },
        { status: 400 }
      );
    }

    // Get the charge
    const { data: charge, error: chargeError } = await supabaseAdmin
      .from('scheduled_charges')
      .select('*')
      .eq('id', chargeId)
      .eq('billing_client_id', billingClientId)
      .eq('status', 'pending')
      .single();

    if (chargeError || !charge) {
      return NextResponse.json(
        { error: 'Charge not found or not pending' },
        { status: 404 }
      );
    }

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
          billing_client_id: billingClientId,
          scheduled_charge_id: chargeId,
          supabase_user_id: user.id,
        },
      },
      metadata: {
        billing_client_id: billingClientId,
        scheduled_charge_id: chargeId,
        supabase_user_id: user.id,
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing_payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing_payment=canceled`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error('Billing checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create billing checkout session' },
      { status: 500 }
    );
  }
}
