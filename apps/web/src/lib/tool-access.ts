import { createAdminClient } from '@/lib/supabase/admin';
import { getWorkspaceContext } from '@/lib/workspace';
import { hasActiveAccess } from '@/types';
import type { Profile } from '@/types';

export interface ToolAccessResult {
  allowed: boolean;
  reason?: string;
  cta?: 'subscribe' | 'contact_admin' | 'create_workspace';
}

/**
 * Check if a user has access to a specific tool by slug.
 * Replaces the scattered hardcoded logic in the tools layout.
 */
export async function checkToolAccess(
  toolSlug: string,
  profile: Profile,
  userId: string
): Promise<ToolAccessResult> {
  const admin = createAdminClient();

  // 1. Look up tool by slug
  const { data: tool } = await admin
    .from('tools')
    .select('*')
    .eq('slug', toolSlug)
    .maybeSingle();

  if (!tool) {
    return { allowed: false, reason: 'Tool not found' };
  }

  // 2. Global is_enabled check
  if (!tool.is_enabled) {
    return { allowed: false, reason: 'This tool is currently unavailable' };
  }

  const wsContext = await getWorkspaceContext(userId);

  // 3. Managed workspace path
  if (wsContext && wsContext.workspaceType === 'managed') {
    if (wsContext.workspaceStatus === 'suspended') {
      return {
        allowed: false,
        reason: 'Your workspace is currently suspended',
        cta: 'contact_admin',
      };
    }

    // Check workspace_tools
    const { data: wt } = await admin
      .from('workspace_tools')
      .select('is_enabled')
      .eq('workspace_id', wsContext.workspaceId)
      .eq('tool_id', tool.id)
      .maybeSingle();

    if (!wt?.is_enabled) {
      return {
        allowed: false,
        reason: 'This tool is not enabled for your workspace. Contact your workspace administrator to request access.',
        cta: 'contact_admin',
      };
    }

    return { allowed: true };
  }

  // 4. Individual user: check subscription
  if (!hasActiveAccess(profile)) {
    return {
      allowed: false,
      reason: 'Active subscription required',
      cta: 'subscribe',
    };
  }

  // 5. Check tier_access includes subscription status
  if (!tool.tier_access.includes(profile.subscription_status)) {
    return {
      allowed: false,
      reason: 'This tool requires an active paid subscription',
      cta: 'subscribe',
    };
  }

  // 6. requires_workspace check
  if (tool.requires_workspace && !wsContext) {
    return {
      allowed: false,
      reason: 'This tool requires a workspace. Create one to get started.',
      cta: 'create_workspace',
    };
  }

  return { allowed: true };
}
