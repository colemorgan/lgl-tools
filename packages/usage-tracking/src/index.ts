import type { SupabaseClient } from '@supabase/supabase-js';

export interface RecordUsageParams {
  workspaceId: string;
  userId: string;
  toolSlug: string;
  eventType: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface RecordUsageResult {
  success: boolean;
  eventId?: string;
  error?: string;
}

/**
 * Record a usage event for a metered tool.
 *
 * Flow:
 * 1. Validate quantity > 0
 * 2. Look up tool by slug, check is_enabled
 * 3. Check workspace has tool enabled via workspace_tools
 * 4. Resolve pricing: workspace_tools.pricing_override ?? tools.billing_config
 * 5. Reject if rate is null (not yet configured)
 * 6. Calculate billing_period as YYYY-MM
 * 7. Insert into usage_events with unit_cost_snapshot
 */
export async function recordUsageEvent(
  supabase: SupabaseClient,
  params: RecordUsageParams
): Promise<RecordUsageResult> {
  const { workspaceId, userId, toolSlug, eventType, quantity, metadata } = params;

  // 1. Validate quantity
  if (quantity <= 0) {
    return { success: false, error: 'Quantity must be greater than 0' };
  }

  // 2. Look up tool by slug
  const { data: tool, error: toolError } = await supabase
    .from('tools')
    .select('id, is_enabled, billing_config, tool_type')
    .eq('slug', toolSlug)
    .single();

  if (toolError || !tool) {
    return { success: false, error: `Tool not found: ${toolSlug}` };
  }

  if (!tool.is_enabled) {
    return { success: false, error: `Tool is disabled: ${toolSlug}` };
  }

  // 3. Check workspace has tool enabled
  const { data: workspaceTool, error: wtError } = await supabase
    .from('workspace_tools')
    .select('is_enabled, pricing_override')
    .eq('workspace_id', workspaceId)
    .eq('tool_id', tool.id)
    .single();

  if (wtError || !workspaceTool) {
    return { success: false, error: 'Tool not assigned to workspace' };
  }

  if (!workspaceTool.is_enabled) {
    return { success: false, error: 'Tool is disabled for this workspace' };
  }

  // 4. Resolve pricing
  const override = workspaceTool.pricing_override as Record<string, unknown> | null;
  const globalConfig = tool.billing_config as Record<string, unknown>;

  const rate = override?.rate != null
    ? (override.rate as number)
    : (globalConfig.rate as number | null) ?? null;

  // 5. Reject if rate is null
  if (rate === null) {
    return { success: false, error: 'Metered rate not configured for this tool' };
  }

  // 6. Calculate billing period
  const now = new Date();
  const billingPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // 7. Insert usage event
  const { data: event, error: insertError } = await supabase
    .from('usage_events')
    .insert({
      workspace_id: workspaceId,
      user_id: userId,
      tool_id: tool.id,
      event_type: eventType,
      quantity,
      unit_cost_snapshot: rate,
      metadata: metadata ?? {},
      billing_period: billingPeriod,
      billed: false,
    })
    .select('id')
    .single();

  if (insertError) {
    return { success: false, error: `Failed to record usage: ${insertError.message}` };
  }

  return { success: true, eventId: event.id };
}

export { aggregateUsageForBilling, markEventsAsBilled } from './billing';
