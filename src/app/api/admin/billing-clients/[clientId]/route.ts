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

    const { data: client, error } = await supabase
      .from('billing_clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error || !client) {
      return NextResponse.json({ error: 'Billing client not found' }, { status: 404 });
    }

    const { data: userData } = await supabase.auth.admin.getUserById(client.user_id);

    const { data: charges } = await supabase
      .from('scheduled_charges')
      .select('*')
      .eq('billing_client_id', clientId)
      .order('scheduled_date', { ascending: true });

    return NextResponse.json({
      ...client,
      user_email: userData?.user?.email ?? null,
      charges: charges ?? [],
    });
  } catch (error) {
    console.error('Admin billing client detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch billing client' }, { status: 500 });
  }
}

export async function PATCH(
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
    const supabase = createAdminClient();

    const allowedFields = ['status', 'notes', 'name'];
    const updates: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('billing_clients')
      .update(updates)
      .eq('id', clientId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin billing client update error:', error);
    return NextResponse.json({ error: 'Failed to update billing client' }, { status: 500 });
  }
}
