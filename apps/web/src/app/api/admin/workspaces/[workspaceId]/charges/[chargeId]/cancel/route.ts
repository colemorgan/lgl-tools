import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; chargeId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { workspaceId, chargeId } = await params;
    const supabase = createAdminClient();

    // Get workspace → billing_client_id
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('billing_client_id')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace?.billing_client_id) {
      return NextResponse.json({ error: 'Workspace not found or has no billing client' }, { status: 404 });
    }

    const { data: charge, error: chargeError } = await supabase
      .from('scheduled_charges')
      .select('status')
      .eq('id', chargeId)
      .eq('billing_client_id', workspace.billing_client_id)
      .single();

    if (chargeError || !charge) {
      return NextResponse.json({ error: 'Charge not found' }, { status: 404 });
    }

    if (charge.status !== 'pending') {
      return NextResponse.json({ error: 'Only pending charges can be canceled' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('scheduled_charges')
      .update({ status: 'canceled' })
      .eq('id', chargeId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin workspace cancel charge error:', error);
    return NextResponse.json({ error: 'Failed to cancel charge' }, { status: 500 });
  }
}
