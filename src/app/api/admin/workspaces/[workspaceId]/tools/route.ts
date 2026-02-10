import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

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
    const { tool_id, enabled } = body;

    if (!tool_id || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'tool_id and enabled (boolean) are required' },
        { status: 400 }
      );
    }

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

    // Upsert the tool toggle
    const { data, error } = await supabase
      .from('workspace_tools')
      .upsert(
        { workspace_id: workspaceId, tool_id, enabled },
        { onConflict: 'workspace_id,tool_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin workspace tool toggle error:', error);
    return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 });
  }
}
