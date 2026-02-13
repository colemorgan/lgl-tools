import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  // Get profile to check subscription status
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('subscription_status, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || profile.subscription_status !== 'active') {
    return NextResponse.json(
      { error: 'An active subscription is required to create a workspace' },
      { status: 403 }
    );
  }

  // Check user isn't already in a workspace
  const { data: existingMembership } = await supabaseAdmin
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (existingMembership) {
    return NextResponse.json(
      { error: 'You are already a member of a workspace' },
      { status: 400 }
    );
  }

  let stripeCustomerId: string | null = null;
  try {
    const body = await request.json();
    const { name, company_name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    // Create Stripe Customer for the workspace
    const customer = await stripe.customers.create({
      name: name,
      email: user.email || undefined,
      metadata: { workspace: 'true', user_id: user.id },
    });
    stripeCustomerId = customer.id;

    // Create backing billing_clients row
    const { data: billingClient, error: bcError } = await supabaseAdmin
      .from('billing_clients')
      .insert({
        name,
        user_id: user.id,
        stripe_customer_id: customer.id,
        status: 'active',
      })
      .select()
      .single();

    if (bcError) throw bcError;

    // Create the workspace
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .insert({
        name,
        type: 'self_serve',
        company_name: company_name || null,
        billing_client_id: billingClient.id,
        stripe_customer_id: customer.id,
        status: 'active',
      })
      .select()
      .single();

    if (wsError) throw wsError;

    // Add user as owner
    const { error: memberError } = await supabaseAdmin
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner',
      });

    if (memberError) throw memberError;

    // Enable all available tools from DB registry
    const { data: dbTools } = await supabaseAdmin
      .from('tools')
      .select('id, is_enabled')
      .order('sort_order');

    if (dbTools && dbTools.length > 0) {
      const toolRows = dbTools.map((tool) => ({
        workspace_id: workspace.id,
        tool_id: tool.id,
        is_enabled: tool.is_enabled,
        enabled_at: tool.is_enabled ? new Date().toISOString() : null,
      }));

      const { error: toolsError } = await supabaseAdmin.from('workspace_tools').insert(toolRows);
      if (toolsError) throw toolsError;
    }

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('Self-serve workspace creation error:', error);

    // Clean up orphaned Stripe customer if DB operations failed
    if (stripeCustomerId) {
      try {
        await stripe.customers.del(stripeCustomerId);
      } catch {
        // Best effort cleanup
      }
    }

    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
