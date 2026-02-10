import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/admin/workspaces/[workspaceId]/members — Add an existing user to the workspace
 * Body: { email: string, role: 'owner' | 'user' }
 */
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

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const memberRole = role === 'owner' ? 'owner' : 'user';
    const supabase = createAdminClient();

    // Verify workspace exists
    const { data: workspace, error: wsError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', workspaceId)
      .single();

    if (wsError || !workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Find user by email via admin API
    const { data: listResult, error: listError } = await supabase.auth.admin.listUsers({
      perPage: 1000,
    });

    if (listError) throw listError;

    const matchedUser = listResult?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!matchedUser) {
      return NextResponse.json(
        { error: 'No user found with that email' },
        { status: 404 }
      );
    }

    const userId = matchedUser.id;

    // Check if already a member
    const { data: existing } = await supabase
      .from('workspace_members')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member of this workspace' },
        { status: 409 }
      );
    }

    // Add member
    const { data: member, error: memberError } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspaceId,
        user_id: userId,
        role: memberRole,
      })
      .select()
      .single();

    if (memberError) throw memberError;

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Add workspace member error:', error);
    return NextResponse.json({ error: 'Failed to add member' }, { status: 500 });
  }
}
