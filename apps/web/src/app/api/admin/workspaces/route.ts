import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { tools as allTools } from '@/config/tools';

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

    // Enrich with member count and pending charges count
    const enriched = await Promise.all(
      (workspaces ?? []).map(async (workspace) => {
        const { count: memberCount } = await supabase
          .from('workspace_members')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspace.id);

        let pendingChargesCount = 0;
        if (workspace.billing_client_id) {
          const { count } = await supabase
            .from('scheduled_charges')
            .select('*', { count: 'exact', head: true })
            .eq('billing_client_id', workspace.billing_client_id)
            .eq('status', 'pending');
          pendingChargesCount = count ?? 0;
        }

        return {
          ...workspace,
          member_count: memberCount ?? 0,
          pending_charges_count: pendingChargesCount,
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
    const {
      name,
      company_name,
      company_tax_id,
      company_address_street,
      company_address_city,
      company_address_state,
      company_address_zip,
      company_address_country,
      primary_contact_name,
      contact_email,
      contact_phone,
      notes,
      tools: toolSelections,
    } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!company_name) {
      return NextResponse.json({ error: 'company_name is required' }, { status: 400 });
    }
    if (!primary_contact_name) {
      return NextResponse.json({ error: 'primary_contact_name is required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Admin-created workspaces are always managed — create a Stripe Customer
    const customer = await stripe.customers.create({
      name: company_name,
      email: contact_email || undefined,
      phone: contact_phone || undefined,
      address: {
        line1: company_address_street || undefined,
        city: company_address_city || undefined,
        state: company_address_state || undefined,
        postal_code: company_address_zip || undefined,
        country: company_address_country || undefined,
      },
      metadata: { workspace: 'true' },
    });

    // Create a backing billing_clients row (FK target for scheduled_charges)
    const { data: billingClient, error: bcError } = await supabase
      .from('billing_clients')
      .insert({
        name,
        notes: notes || null,
        stripe_customer_id: customer.id,
        status: 'active',
      })
      .select()
      .single();

    if (bcError) throw bcError;

    // Create the workspace linked to the billing client
    const { data: workspace, error } = await supabase
      .from('workspaces')
      .insert({
        name,
        type: 'managed',
        company_name: company_name || null,
        company_tax_id: company_tax_id || null,
        company_address_street: company_address_street || null,
        company_address_city: company_address_city || null,
        company_address_state: company_address_state || null,
        company_address_zip: company_address_zip || null,
        company_address_country: company_address_country || null,
        primary_contact_name: primary_contact_name || null,
        contact_email: contact_email || null,
        contact_phone: contact_phone || null,
        notes: notes || null,
        stripe_customer_id: customer.id,
        billing_client_id: billingClient.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Populate workspace_tools — use selections from form if provided, otherwise defaults
    const toolRows = allTools.map((tool) => ({
      workspace_id: workspace.id,
      tool_id: tool.slug,
      enabled: toolSelections
        ? (toolSelections[tool.slug] ?? false)
        : tool.status === 'available',
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
