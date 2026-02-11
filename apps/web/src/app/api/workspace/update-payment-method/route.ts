import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireWorkspaceOwner } from '@/lib/workspace';
import { stripe } from '@/lib/stripe';

/**
 * POST /api/workspace/update-payment-method — Create a Stripe SetupIntent session
 * for the workspace owner to add or update the card on file.
 *
 * Auto-provisions Stripe customer and billing client if they don't exist yet,
 * so the client owner can add their own card without waiting for an LGL admin.
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

    // Fetch workspace with all billing fields
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('id, name, stripe_customer_id, billing_client_id, contact_email')
      .eq('id', ctx.workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    let stripeCustomerId = workspace.stripe_customer_id;
    let billingClientId = workspace.billing_client_id;

    // Auto-create billing client if missing
    if (!billingClientId) {
      const { data: newClient, error: clientError } = await supabaseAdmin
        .from('billing_clients')
        .insert({
          name: workspace.name,
          status: 'active',
        })
        .select()
        .single();

      if (clientError) throw clientError;

      billingClientId = newClient.id;

      await supabaseAdmin
        .from('workspaces')
        .update({ billing_client_id: billingClientId })
        .eq('id', ctx.workspaceId);
    }

    // Auto-create Stripe customer if missing
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: workspace.name,
        email: workspace.contact_email || user.email || undefined,
        metadata: {
          workspace_id: ctx.workspaceId,
          billing_client_id: billingClientId,
        },
      });

      stripeCustomerId = customer.id;

      // Update both workspace and billing_clients with the Stripe customer ID
      await Promise.all([
        supabaseAdmin
          .from('workspaces')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', ctx.workspaceId),
        supabaseAdmin
          .from('billing_clients')
          .update({ stripe_customer_id: stripeCustomerId })
          .eq('id', billingClientId),
      ]);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com';

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'setup',
      payment_method_types: ['card'],
      setup_intent_data: {
        metadata: {
          workspace_id: ctx.workspaceId,
          billing_client_id: billingClientId,
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
