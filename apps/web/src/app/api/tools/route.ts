import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceContext } from '@/lib/workspace';
import { resolveToolPricing } from '@/lib/tool-pricing';
import type { ToolRecord, WorkspaceTool } from '@/types';

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const wsContext = await getWorkspaceContext(user.id);

    // Get profile for subscription status
    const { data: profile } = await admin
      .from('profiles')
      .select('subscription_status')
      .eq('id', user.id)
      .single();

    const subscriptionStatus = profile?.subscription_status ?? 'expired_trial';

    if (wsContext) {
      // Managed/workspace user: return tools enabled for their workspace
      const { data: workspaceTools } = await admin
        .from('workspace_tools')
        .select('*, tools(*)')
        .eq('workspace_id', wsContext.workspaceId)
        .eq('is_enabled', true);

      const tools = (workspaceTools ?? []).map((wt) => {
        const tool = wt.tools as unknown as ToolRecord;
        const pricing = resolveToolPricing(tool, wt as unknown as WorkspaceTool);
        return { ...tool, pricing, workspace_tool: { is_enabled: wt.is_enabled, pricing_override: wt.pricing_override } };
      }).sort((a, b) => a.sort_order - b.sort_order);

      return NextResponse.json(tools);
    }

    // Individual user: return all advertised + enabled tools, filtered by tier_access
    const { data: allTools, error } = await admin
      .from('tools')
      .select('*')
      .eq('is_advertised', true)
      .eq('is_enabled', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const tools = (allTools ?? [])
      .filter((t) => t.tier_access.includes(subscriptionStatus))
      .map((tool) => {
        const pricing = resolveToolPricing(tool as ToolRecord);
        return { ...tool, pricing };
      });

    return NextResponse.json(tools);
  } catch (error) {
    console.error('Tools list error:', error);
    return NextResponse.json({ error: 'Failed to fetch tools' }, { status: 500 });
  }
}
