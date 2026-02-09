import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { tools } from '@/config/tools';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();

    const { data: workspaces, error } = await supabase
      .from('workspaces')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Enrich with member count and billing client name
    const enriched = await Promise.all(
      (workspaces ?? []).map(async (workspace) => {
        const { count } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id);

        let billingClientName: string | null = null;
        if (workspace.billing_client_id) {
          const { data: client } = await supabase
            .from('billing_clients')
            .select('name')
            .eq('id', workspace.billing_client_id)
            .single();
          billingClientName = client?.name ?? null;
        }

        return {
          ...workspace,
          member_count: count ?? 0,
          billing_client_name: billingClientName,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error('Admin workspaces list error:', error);
    return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, type } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'name and type are required' }, { status: 400 });
    }

    if (!['self_serve', 'managed'].includes(type)) {
      return NextResponse.json({ error: 'type must be self_serve or managed' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // For managed workspaces, create a Stripe Customer
    let stripeCustomerId: string | null = null;
    if (type === 'managed') {
      const customer = await stripe.customers.create({
        name,
        metadata: { workspace: 'true' },
      });
      stripeCustomerId = customer.id;
    }

    // Create the workspace
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({
        name,
        type,
        stripe_customer_id: stripeCustomerId,
      })
      .select()
      .single();

    if (error) throw error;

    // Populate workspace_tools with all tools from config
    const toolRows = tools.map((tool) => ({
      workspace_id: workspace.id,
      tool_id: tool.slug,
      enabled: tool.status === 'available',
    }));

    const { error: toolsError } = await supabase
      .from('workspace_tools')
      .insert(toolRows);

    if (toolsError) {
      console.error('Failed to populate workspace tools:', toolsError);
    }

    return NextResponse.json(workspace, { status: 201 });
  } catch (error) {
    console.error('Admin create workspace error:', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
