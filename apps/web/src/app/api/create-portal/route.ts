import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';
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
        new URL('/login?redirectTo=/api/create-portal', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    // Prevent managed workspace users from accessing Stripe billing portal
    const wsContext = await getWorkspaceContext(user.id);
    if (wsContext?.workspaceType === 'managed') {
      return NextResponse.redirect(
        new URL('/dashboard', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return NextResponse.redirect(
        new URL('/dashboard?error=no-subscription', process.env.NEXT_PUBLIC_APP_URL!)
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
    });

    return NextResponse.redirect(session.url);
  } catch (error) {
    console.error('Portal error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
