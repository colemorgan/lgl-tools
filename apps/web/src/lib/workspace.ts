import { cache } from 'react';
import { createAdminClient } from '@/lib/supabase/admin';
import type { WorkspaceType, WorkspaceStatus, WorkspaceMemberRole } from '@/types';

export interface WorkspaceContext {
  workspaceId: string;
  workspaceName: string;
  workspaceType: WorkspaceType;
  workspaceStatus: WorkspaceStatus;
  memberRole: WorkspaceMemberRole;
  billingClientId: string | null;
  stripeCustomerId: string | null;
  stripePaymentMethodId: string | null;
  enabledTools: string[];
}

/**
 * Get the workspace context for a user. Returns null if the user
 * is not a member of any active or suspended workspace.
 * Wrapped with React.cache() so multiple server components in one
 * render share a single DB round-trip.
 */
export const getWorkspaceContext = cache(
  async (userId: string): Promise<WorkspaceContext | null> => {
    const supabase = createAdminClient();

    // Get membership + workspace in one query
    const { data: membership } = await supabase
      .from('workspace_members')
      .select(
        'workspace_id, role, workspaces!inner(id, name, type, status, billing_client_id, stripe_customer_id, stripe_payment_method_id)'
      )
      .eq('user_id', userId)
      .in('workspaces.status', ['active', 'suspended'])
      .limit(1)
      .maybeSingle();

    if (!membership) return null;

    const ws = membership.workspaces as unknown as {
      id: string;
      name: string;
      type: WorkspaceType;
      status: WorkspaceStatus;
      billing_client_id: string | null;
      stripe_customer_id: string | null;
      stripe_payment_method_id: string | null;
    };

    // Fetch enabled tools for this workspace, joined with tools table for slugs
    const { data: workspaceTools } = await supabase
      .from('workspace_tools')
      .select('tool_id, tools(slug)')
      .eq('workspace_id', ws.id)
      .eq('is_enabled', true);

    return {
      workspaceId: ws.id,
      workspaceName: ws.name,
      workspaceType: ws.type,
      workspaceStatus: ws.status,
      memberRole: membership.role as WorkspaceMemberRole,
      billingClientId: ws.billing_client_id,
      stripeCustomerId: ws.stripe_customer_id,
      stripePaymentMethodId: ws.stripe_payment_method_id,
      enabledTools: (workspaceTools ?? []).map(
        (t) => (t.tools as unknown as { slug: string })?.slug ?? ''
      ).filter(Boolean),
    };
  }
);

/**
 * Require the user to be a workspace owner. Throws if not.
 */
export async function requireWorkspaceOwner(userId: string): Promise<{
  workspaceId: string;
  billingClientId: string | null;
}> {
  const ctx = await getWorkspaceContext(userId);

  if (!ctx || ctx.memberRole !== 'owner') {
    throw new Error('Unauthorized: Workspace owner access required');
  }

  return {
    workspaceId: ctx.workspaceId,
    billingClientId: ctx.billingClientId,
  };
}

/**
 * Check if a managed workspace owner still needs to add a payment method.
 */
export function needsPaymentSetup(ctx: WorkspaceContext | null): boolean {
  if (!ctx) return false;
  return (
    ctx.workspaceType === 'managed' &&
    ctx.memberRole === 'owner' &&
    !ctx.stripePaymentMethodId
  );
}

/**
 * Check if a managed workspace user has access to a specific tool.
 * Returns true for non-managed users (they use individual subscription checks).
 */
export async function hasToolAccess(
  userId: string,
  toolSlug: string
): Promise<boolean> {
  const ctx = await getWorkspaceContext(userId);

  // Not in a workspace — fall through to individual subscription checks
  if (!ctx) return true;

  // Non-managed workspaces don't restrict tools
  if (ctx.workspaceType !== 'managed') return true;

  return ctx.enabledTools.includes(toolSlug);
}
