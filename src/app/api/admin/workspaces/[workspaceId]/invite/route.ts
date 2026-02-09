import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/resend';
import ClientInviteEmail from '../../../../../../../emails/client-invite';

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
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
    const { email, role } = body;

    const workspaceRole = role === 'admin' ? 'admin' : 'user';

    const supabase = createAdminClient();

    // Fetch workspace to get name and billing_client_id
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id, name, billing_client_id')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Workspace must have a billing client to create invites
    // (If no billing client, create one with the workspace name)
    let billingClientId = workspace.billing_client_id;
    if (!billingClientId) {
      const { data: newClient, error: clientError } = await supabase
        .from('billing_clients')
        .insert({
          name: workspace.name,
          status: 'active',
        })
        .select()
        .single();

      if (clientError) throw clientError;

      billingClientId = newClient.id;

      // Link billing client to workspace
      await supabase
        .from('workspaces')
        .update({ billing_client_id: billingClientId })
        .eq('id', workspaceId);
    }

    const token = generateToken();

    const { data: invite, error: inviteError } = await supabase
      .from('client_invites')
      .insert({
        billing_client_id: billingClientId,
        workspace_id: workspaceId,
        workspace_role: workspaceRole,
        token,
        email: email || null,
      })
      .select()
      .single();

    if (inviteError) {
      console.error('Failed to create invite:', inviteError);
      return NextResponse.json(
        { error: `Failed to create invite: ${inviteError.message}` },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://lgltools.com';
    const inviteUrl = `${appUrl}/invite/${token}`;

    // Send invite email if email provided
    if (email) {
      try {
        await sendEmail({
          to: email,
          subject: `You've been invited to join ${workspace.name} on LGL Tools`,
          react: ClientInviteEmail({ companyName: workspace.name, inviteUrl }),
        });
      } catch (emailError) {
        console.error('Failed to send invite email:', emailError);
      }
    }

    return NextResponse.json(
      {
        invite,
        invite_url: inviteUrl,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Workspace invite error:', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}
