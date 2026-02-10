import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { BillingClient, ScheduledCharge } from '@/types';

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createAdminClient();

  // Try workspace membership first: workspace → billing_client_id → charges
  const { data: membership } = await supabaseAdmin
    .from('workspace_members')
    .select('workspace_id, workspaces!inner(billing_client_id)')
    .eq('user_id', user.id)
    .eq('workspaces.status', 'active')
    .limit(1)
    .maybeSingle();

  const billingClientId =
    (membership?.workspaces as unknown as { billing_client_id: string | null })?.billing_client_id ?? null;

  // Fall back to direct billing_clients.user_id lookup
  let resolvedBillingClientId = billingClientId;
  if (!resolvedBillingClientId) {
    const { data: directClient } = await supabaseAdmin
      .from('billing_clients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    resolvedBillingClientId = directClient?.id ?? null;
  }

  if (!resolvedBillingClientId) {
    return NextResponse.json({ billing_client: null, charges: [] });
  }

  // Fetch billing client
  const { data: billingClient } = await supabaseAdmin
    .from('billing_clients')
    .select('*')
    .eq('id', resolvedBillingClientId)
    .single();

  if (!billingClient) {
    return NextResponse.json({ billing_client: null, charges: [] });
  }

  // Fetch all charges for this billing client
  const { data: charges, error: chargesError } = await supabaseAdmin
    .from('scheduled_charges')
    .select('*')
    .eq('billing_client_id', resolvedBillingClientId)
    .order('scheduled_date', { ascending: false });

  if (chargesError) {
    console.error('Error fetching charges:', chargesError);
    return NextResponse.json({ error: 'Failed to fetch billing data' }, { status: 500 });
  }

  return NextResponse.json({
    billing_client: billingClient as BillingClient,
    charges: (charges ?? []) as ScheduledCharge[],
  });
}
