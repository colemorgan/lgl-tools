import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string; chargeId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { clientId, chargeId } = await params;
    const supabase = createAdminClient();

    const { data: charge, error: chargeError } = await supabase
      .from('scheduled_charges')
      .select('status')
      .eq('id', chargeId)
      .eq('billing_client_id', clientId)
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
    console.error('Admin cancel charge error:', error);
    return NextResponse.json({ error: 'Failed to cancel charge' }, { status: 500 });
  }
}
