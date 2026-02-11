import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireWorkspaceOwner } from '@/lib/workspace';
import { stripe } from '@/lib/stripe';

/**
 * POST /api/workspace/update-payment-method — Create a Stripe SetupIntent session
 * for the workspace owner to update the card on file. Redirects to /billing on success.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let ctx: Awaited<ReturnType<typeof requireWorkspaceOwner>>;
  try {
    ctx = await requireWorkspaceOwner(user.id);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const supabaseAdmin = createAdminClient();

    // Get workspace stripe customer id
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('stripe_customer_id')
      .eq('id', ctx.workspaceId)
      .single();

    if (!workspace?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer linked to this workspace' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com';

    const session = await stripe.checkout.sessions.create({
      customer: workspace.stripe_customer_id,
      mode: 'setup',
      payment_method_types: ['card'],
      setup_intent_data: {
        metadata: {
          workspace_id: ctx.workspaceId,
          billing_client_id: ctx.billingClientId ?? '',
        },
      },
      success_url: `${appUrl}/billing?setup=success`,
      cancel_url: `${appUrl}/billing?setup=canceled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Update payment method error:', error);
    return NextResponse.json(
      { error: 'Failed to create setup session' },
      { status: 500 }
    );
  }
}
