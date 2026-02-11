import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe, createOrRetrieveCustomer } from '@/lib/stripe';
import { getWorkspaceContext } from '@/lib/workspace';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.redirect(
        new URL('/login?redirectTo=/api/create-checkout', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Prevent managed workspace users from subscribing to Technician plan
    const wsContext = await getWorkspaceContext(user.id);
    if (wsContext?.workspaceType === 'managed') {
      return NextResponse.redirect(
        new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single();

    const customerId = await createOrRetrieveCustomer(
      user.id,
      user.email!,
      profile?.full_name
    );

    const priceId = process.env.STRIPE_PRICE_ID;
    if (!priceId) {
      return NextResponse.json(
        { error: 'Stripe price not configured' },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=canceled`,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
        },
      },
      metadata: {
        supabase_user_id: user.id,
      },
    });

    if (!session.url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session' },
        { status: 500 }
      );
    }

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
