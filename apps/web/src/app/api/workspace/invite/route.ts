import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireWorkspaceOwner } from '@/lib/workspace';
import { sendEmail } from '@/lib/resend';
import ClientInviteEmail from '../../../../../emails/client-invite';

function generateToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * POST /api/workspace/invite — Create an invite (owner only, role always 'user')
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let ctx: Awaited<ReturnType<typeof requireWorkspaceOwner>>;
  try {
    ctx = await requireWorkspaceOwner(user.id);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email } = body;

    const supabaseAdmin = createAdminClient();

    // Get workspace name for the invite email
    const { data: workspace } = await supabaseAdmin
      .from('workspaces')
      .select('name, billing_client_id')
      .eq('id', ctx.workspaceId)
      .single();

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    let billingClientId = workspace.billing_client_id;
    if (!billingClientId) {
      const { data: newClient, error: clientError } = await supabaseAdmin
        .from('billing_clients')
        .insert({
          name: workspace.name,
          status: 'active',
        })
        .select()
        .single();

      if (clientError) throw clientError;

      billingClientId = newClient.id;

      await supabaseAdmin
        .from('workspaces')
        .update({ billing_client_id: billingClientId })
        .eq('id', ctx.workspaceId);
    }

    const token = generateToken();

    const { data: invite, error: inviteError } = await supabaseAdmin
      .from('client_invites')
      .insert({
        billing_client_id: billingClientId,
        workspace_id: ctx.workspaceId,
        workspace_role: 'user',
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

    return NextResponse.json({ invite, invite_url: inviteUrl }, { status: 201 });
  } catch (error) {
    console.error('Workspace invite error:', error);
    return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
  }
}
