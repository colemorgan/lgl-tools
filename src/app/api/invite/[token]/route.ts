import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createAdminClient();

    // Look up the invite by token
    const { data: invite, error } = await supabase
      .from('client_invites')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !invite) {
      return NextResponse.json({ error: 'Invalid invite link' }, { status: 404 });
    }

    // Check if already accepted
    if (invite.accepted_at) {
      return NextResponse.json({ error: 'This invite has already been used' }, { status: 410 });
    }

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This invite has expired' }, { status: 410 });
    }

    // Fetch the billing client name
    const { data: client } = await supabase
      .from('billing_clients')
      .select('id, name, status')
      .eq('id', invite.billing_client_id)
      .single();

    if (!client) {
      return NextResponse.json({ error: 'Billing client not found' }, { status: 404 });
    }

    return NextResponse.json({
      company_name: client.name,
      email: invite.email,
    });
  } catch (error) {
    console.error('Invite validation error:', error);
    return NextResponse.json({ error: 'Failed to validate invite' }, { status: 500 });
  }
}
