import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { clientId } = await params;
    const supabase = createAdminClient();

    const { data: charges, error } = await supabase
      .from('scheduled_charges')
      .select('*')
      .eq('billing_client_id', clientId)
      .order('scheduled_date', { ascending: true });

    if (error) throw error;

    return NextResponse.json(charges ?? []);
  } catch (error) {
    console.error('Admin charges list error:', error);
    return NextResponse.json({ error: 'Failed to fetch charges' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { clientId } = await params;
    const body = await request.json();
    const { amount_cents, description, scheduled_date, currency } = body;

    if (!amount_cents || !scheduled_date) {
      return NextResponse.json({ error: 'amount_cents and scheduled_date are required' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify client exists
    const { data: client, error: clientError } = await supabase
      .from('billing_clients')
      .select('id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json({ error: 'Billing client not found' }, { status: 404 });
    }

    const { data: charge, error } = await supabase
      .from('scheduled_charges')
      .insert({
        billing_client_id: clientId,
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
    console.error('Admin create charge error:', error);
    return NextResponse.json({ error: 'Failed to create charge' }, { status: 500 });
  }
}
