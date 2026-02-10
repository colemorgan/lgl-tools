import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

async function getBillingClientId(supabase: ReturnType<typeof createAdminClient>, workspaceId: string) {
  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('billing_client_id')
    .eq('id', workspaceId)
    .single();

  if (error || !workspace) return null;
  return workspace.billing_client_id;
}

export async function GET(
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

    const billingClientId = await getBillingClientId(supabase, workspaceId);
    if (!billingClientId) {
      return NextResponse.json({ error: 'Workspace not found or has no billing client' }, { status: 404 });
    }

    const { data: charges, error } = await supabase
      .from('scheduled_charges')
      .select('*')
      .eq('billing_client_id', billingClientId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json(charges ?? []);
  } catch (error) {
    console.error('Admin workspace charges list error:', error);
    return NextResponse.json({ error: 'Failed to fetch charges' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { workspaceId } = await params;
    const body = await request.json();
    const { amount_cents, description, scheduled_date, currency } = body;

    if (!amount_cents || !scheduled_date) {
      return NextResponse.json({ error: 'amount_cents and scheduled_date are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const billingClientId = await getBillingClientId(supabase, workspaceId);
    if (!billingClientId) {
      return NextResponse.json({ error: 'Workspace not found or has no billing client' }, { status: 404 });
    }

    const { data: charge, error } = await supabase
      .from('scheduled_charges')
      .insert({
        billing_client_id: billingClientId,
        amount_cents,
        description: description || null,
        scheduled_date,
        currency: currency || 'usd',
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(charge, { status: 201 });
  } catch (error) {
    console.error('Admin workspace create charge error:', error);
    return NextResponse.json({ error: 'Failed to create charge' }, { status: 500 });
  }
}
