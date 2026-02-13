import type { ToolRecord, WorkspaceTool } from '@/types';

export interface ResolvedPricing {
  type: string;
  rate: number | null;
  unit: string | null;
  description?: string;
  source: 'override' | 'global';
}

/**
 * Resolve the effective pricing for a tool within a workspace context.
 * Workspace-level pricing_override takes precedence over global billing_config.
 */
export function resolveToolPricing(
  tool: ToolRecord,
  workspaceTool?: WorkspaceTool | null
): ResolvedPricing {
  const override = workspaceTool?.pricing_override;

  if (override && typeof override === 'object' && 'type' in override) {
    return {
      type: (override.type as string) || tool.billing_config.type as string || 'included',
      rate: (override.rate as number) ?? null,
      unit: (override.unit as string) ?? null,
      description: override.description as string | undefined,
      source: 'override',
    };
  }

  const config = tool.billing_config;
  return {
    type: (config.type as string) || 'included',
    rate: (config.rate as number) ?? null,
    unit: (config.unit as string) ?? null,
    source: 'global',
  };
}
