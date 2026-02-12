import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workspaceId: string; toolId: string }> }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { workspaceId, toolId } = await params;
    const body = await request.json();

    const updates: Record<string, unknown> = {};
    if (body.is_enabled !== undefined) {
      updates.is_enabled = body.is_enabled;
      if (body.is_enabled) {
        updates.enabled_at = new Date().toISOString();
        updates.disabled_at = null;
      } else {
        updates.disabled_at = new Date().toISOString();
      }
    }
    if (body.pricing_override !== undefined) updates.pricing_override = body.pricing_override;
    if (body.config_override !== undefined) updates.config_override = body.config_override;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('workspace_tools')
      .update(updates)
      .eq('workspace_id', workspaceId)
      .eq('tool_id', toolId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Admin workspace tool update error:', error);
    return NextResponse.json({ error: 'Failed to update workspace tool' }, { status: 500 });
  }
}
