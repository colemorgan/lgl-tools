import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceContext } from '@/lib/workspace';
import { hasActiveAccess } from '@/types';
import type { Profile } from '@/types';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { slug } = await params;
    const admin = createAdminClient();

    // Look up tool
    const { data: tool } = await admin
      .from('tools')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!tool) {
      return NextResponse.json({ allowed: false, reason: 'Tool not found' });
    }

    if (!tool.is_enabled) {
      return NextResponse.json({ allowed: false, reason: 'Tool is currently disabled' });
    }

    const wsContext = await getWorkspaceContext(user.id);

    // Managed workspace path
    if (wsContext && wsContext.workspaceType === 'managed') {
      if (wsContext.workspaceStatus === 'suspended') {
        return NextResponse.json({
          allowed: false,
          reason: 'Workspace is suspended',
          cta: 'contact_admin',
        });
      }

      // Check workspace_tools
      const { data: wt } = await admin
        .from('workspace_tools')
        .select('is_enabled')
        .eq('workspace_id', wsContext.workspaceId)
        .eq('tool_id', tool.id)
        .maybeSingle();

      if (!wt?.is_enabled) {
        return NextResponse.json({
          allowed: false,
          reason: 'This tool is not enabled for your workspace',
          cta: 'contact_admin',
        });
      }

      return NextResponse.json({ allowed: true });
    }

    // Individual user path
    const { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!profile || !hasActiveAccess(profile as Profile)) {
      return NextResponse.json({
        allowed: false,
        reason: 'Active subscription required',
        cta: 'subscribe',
      });
    }

    // Check tier_access
    if (!tool.tier_access.includes(profile.subscription_status)) {
      return NextResponse.json({
        allowed: false,
        reason: 'This tool requires an active subscription',
        cta: 'subscribe',
      });
    }

    // Check requires_workspace
    if (tool.requires_workspace && !wsContext) {
      return NextResponse.json({
        allowed: false,
        reason: 'This tool requires a workspace',
        cta: 'create_workspace',
      });
    }

    return NextResponse.json({ allowed: true });
  } catch (error) {
    console.error('Tool access check error:', error);
    return NextResponse.json({ error: 'Failed to check access' }, { status: 500 });
  }
}
