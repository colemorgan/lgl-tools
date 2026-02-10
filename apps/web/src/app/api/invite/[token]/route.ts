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

    // If workspace invite, use workspace name; otherwise use billing client name
    let companyName: string;
    if (invite.workspace_id) {
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('id, name')
        .eq('id', invite.workspace_id)
        .single();
      companyName = workspace?.name ?? 'Your Workspace';
    } else {
      const { data: client } = await supabase
        .from('billing_clients')
        .select('id, name, status')
        .eq('id', invite.billing_client_id)
        .single();

      if (!client) {
        return NextResponse.json({ error: 'Billing client not found' }, { status: 404 });
      }
      companyName = client.name;
    }

    return NextResponse.json({
      company_name: companyName,
      email: invite.email,
      is_workspace_invite: !!invite.workspace_id,
    });
  } catch (error) {
    console.error('Invite validation error:', error);
    return NextResponse.json({ error: 'Failed to validate invite' }, { status: 500 });
  }
}
