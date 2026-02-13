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

  // 1. Look up tool by slug from DB (may not exist if migration not applied)
  const { data: tool, error: toolError } = await admin
    .from('tools')
    .select('*')
    .eq('slug', toolSlug)
    .maybeSingle();

  const wsContext = await getWorkspaceContext(userId);

  // If tools table doesn't exist yet, fall back to legacy access logic
  if (toolError || !tool) {
    return checkToolAccessLegacy(toolSlug, profile, wsContext);
  }

  // 2. Global is_enabled check
  if (!tool.is_enabled) {
    return { allowed: false, reason: 'This tool is currently unavailable' };
  }

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

/** Legacy access check when the tools DB table doesn't exist yet */
function checkToolAccessLegacy(
  toolSlug: string,
  profile: Profile,
  wsContext: Awaited<ReturnType<typeof getWorkspaceContext>>
): ToolAccessResult {
  // Managed workspace: check membership + enabled tools list
  if (wsContext && wsContext.workspaceType === 'managed') {
    if (wsContext.workspaceStatus === 'suspended') {
      return { allowed: false, reason: 'Your workspace is currently suspended', cta: 'contact_admin' };
    }
    if (!wsContext.enabledTools.includes(toolSlug)) {
      return { allowed: false, reason: 'This tool is not enabled for your workspace.', cta: 'contact_admin' };
    }
    return { allowed: true };
  }

  // Individual user: check subscription
  if (!hasActiveAccess(profile)) {
    return { allowed: false, reason: 'Active subscription required', cta: 'subscribe' };
  }

  // Metered tools require paid subscription (not trialing)
  if (toolSlug === 'live-stream' && profile.subscription_status === 'trialing') {
    return { allowed: false, reason: 'This tool requires an active paid subscription', cta: 'subscribe' };
  }

  return { allowed: true };
}
