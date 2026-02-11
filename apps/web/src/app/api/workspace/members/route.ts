import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireWorkspaceOwner } from '@/lib/workspace';

/**
 * GET /api/workspace/members — List workspace members (owner only)
 */
export async function GET() {
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

  const supabaseAdmin = createAdminClient();

  // Fetch members
  const { data: members, error: membersError } = await supabaseAdmin
    .from('workspace_members')
    .select('id, user_id, role, created_at')
    .eq('workspace_id', ctx.workspaceId)
    .order('created_at', { ascending: true });

  if (membersError) {
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
  }

  // Enrich with user name/email from auth
  const enriched = await Promise.all(
    (members ?? []).map(async (member) => {
      const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(
        member.user_id
      );
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', member.user_id)
        .maybeSingle();

      return {
        ...member,
        full_name: profile?.full_name ?? null,
        email: authUser?.user?.email ?? null,
      };
    })
  );

  // Fetch pending invites
  const { data: invites } = await supabaseAdmin
    .from('client_invites')
    .select('*')
    .eq('workspace_id', ctx.workspaceId)
    .is('accepted_at', null)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false });

  return NextResponse.json({ members: enriched, invites: invites ?? [] });
}

/**
 * DELETE /api/workspace/members — Remove a member (owner only, cannot remove self)
 */
export async function DELETE(request: NextRequest) {
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

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  if (userId === user.id) {
    return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  const { error: deleteError } = await supabaseAdmin
    .from('workspace_members')
    .delete()
    .eq('workspace_id', ctx.workspaceId)
    .eq('user_id', userId);

  if (deleteError) {
    return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
