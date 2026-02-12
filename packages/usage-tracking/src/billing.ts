import type { SupabaseClient } from '@supabase/supabase-js';

export interface UsageAggregate {
  workspace_id: string;
  workspace_name: string;
  tool_id: string;
  tool_slug: string;
  tool_name: string;
  total_quantity: number;
  total_cost: number;
  event_count: number;
}

export interface AggregationResult {
  aggregates: UsageAggregate[];
  billing_period: string;
}

/**
 * Aggregate unbilled usage events for a billing period.
 * Groups by workspace and tool, sums quantities and costs.
 */
export async function aggregateUsageForBilling(
  supabase: SupabaseClient,
  billingPeriod: string,
  workspaceId?: string
): Promise<AggregationResult> {
  let query = supabase
    .from('usage_events')
    .select('workspace_id, tool_id, quantity, unit_cost_snapshot')
    .eq('billing_period', billingPeriod)
    .eq('billed', false);

  if (workspaceId) {
    query = query.eq('workspace_id', workspaceId);
  }

  const { data: events, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch usage events: ${error.message}`);
  }

  // Group by workspace_id + tool_id
  const groups = new Map<string, {
    workspace_id: string;
    tool_id: string;
    total_quantity: number;
    total_cost: number;
    event_count: number;
  }>();

  for (const event of events ?? []) {
    const key = `${event.workspace_id}:${event.tool_id}`;
    const existing = groups.get(key);
    const eventCost = event.quantity * event.unit_cost_snapshot;

    if (existing) {
      existing.total_quantity += Number(event.quantity);
      existing.total_cost += eventCost;
      existing.event_count += 1;
    } else {
      groups.set(key, {
        workspace_id: event.workspace_id,
        tool_id: event.tool_id,
        total_quantity: Number(event.quantity),
        total_cost: eventCost,
        event_count: 1,
      });
    }
  }

  // Enrich with workspace and tool names
  const aggregates: UsageAggregate[] = [];

  for (const group of Array.from(groups.values())) {
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('name')
      .eq('id', group.workspace_id)
      .single();

    const { data: tool } = await supabase
      .from('tools')
      .select('slug, name')
      .eq('id', group.tool_id)
      .single();

    aggregates.push({
      ...group,
      workspace_name: workspace?.name ?? 'Unknown',
      tool_slug: tool?.slug ?? 'unknown',
      tool_name: tool?.name ?? 'Unknown',
    });
  }

  return { aggregates, billing_period: billingPeriod };
}

/**
 * Mark usage events as billed for a specific workspace + tool + period.
 */
export async function markEventsAsBilled(
  supabase: SupabaseClient,
  billingPeriod: string,
  workspaceId: string,
  toolId: string
): Promise<{ count: number }> {
  const { data, error } = await supabase
    .from('usage_events')
    .update({ billed: true })
    .eq('billing_period', billingPeriod)
    .eq('workspace_id', workspaceId)
    .eq('tool_id', toolId)
    .eq('billed', false)
    .select('id');

  if (error) {
    throw new Error(`Failed to mark events as billed: ${error.message}`);
  }

  return { count: data?.length ?? 0 };
}
