import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

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

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', workspaceId)
      .single();

    if (error || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Fetch members with profile info
    const { data: members } = await supabase
      .from('workspace_members')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });

    // Enrich members with user email and name
    const enrichedMembers = await Promise.all(
      (members ?? []).map(async (member) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', member.user_id)
          .single();

        const { data: userData } = await supabase.auth.admin.getUserById(member.user_id);

        return {
          ...member,
          full_name: profile?.full_name ?? null,
          email: userData?.user?.email ?? null,
        };
      })
    );

    // Fetch tools
    const { data: workspaceTools } = await supabase
      .from('workspace_tools')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('tool_id', { ascending: true });

    // Fetch billing client name
    let billingClientName: string | null = null;
    if (workspace.billing_client_id) {
      const { data: client } = await supabase
        .from('billing_clients')
        .select('name')
        .eq('id', workspace.billing_client_id)
        .single();
      billingClientName = client?.name ?? null;
    }

    // Fetch pending invites
    const { data: invites } = await supabase
      .from('client_invites')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('accepted_at', null)
      .order('created_at', { ascending: false });

    return NextResponse.json({
      ...workspace,
      billing_client_name: billingClientName,
      members: enrichedMembers ?? [],
      tools: workspaceTools ?? [],
      invites: invites ?? [],
    });
  } catch (error) {
    console.error('Admin workspace detail error:', error);
    return NextResponse.json({ error: 'Failed to fetch workspace' }, { status: 500 });
  }
}

export async function PATCH(
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
    const { name, type, status } = body;

    const updates: Record<string, string> = {};
    if (name) updates.name = name;
    if (type && ['self_serve', 'managed'].includes(type)) updates.type = type;
    if (status && ['active', 'suspended', 'closed'].includes(status)) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('workspaces')
      .update(updates)
      .eq('id', workspaceId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin workspace update error:', error);
    return NextResponse.json({ error: 'Failed to update workspace' }, { status: 500 });
  }
}
