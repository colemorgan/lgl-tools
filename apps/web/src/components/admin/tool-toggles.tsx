'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { getToolIcon } from '@/config/tools';
import { resolveToolPricing } from '@/lib/tool-pricing';
import { ToolPricingOverrideDialog } from './tool-pricing-override-dialog';
import type { ToolRecord, WorkspaceTool, WorkspaceType } from '@/types';

interface EnrichedWorkspaceTool extends WorkspaceTool {
  tools: ToolRecord;
}

interface ToolTogglesProps {
  workspaceId: string;
  workspaceTools: EnrichedWorkspaceTool[];
  workspaceType: WorkspaceType;
  onUpdate: () => void;
}

export function ToolToggles({ workspaceId, workspaceTools, workspaceType, onUpdate }: ToolTogglesProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  async function toggleTool(toolId: string, isEnabled: boolean) {
    setUpdating(toolId);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}/tools`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_id: toolId, is_enabled: isEnabled }),
      });
      if (res.ok) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to toggle tool:', error);
    }
    setUpdating(null);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {workspaceTools.map((wt) => {
        const tool = wt.tools;
        if (!tool) return null;

        const Icon = getToolIcon(tool.icon);
        const pricing = resolveToolPricing(tool, wt);

        return (
          <div
            key={wt.tool_id}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <Label className="font-medium">{tool.name}</Label>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-xs">
                    {tool.tool_type}
                  </Badge>
                  {pricing.type === 'metered' && (
                    <span className="text-xs text-muted-foreground">
                      {pricing.rate != null
                        ? `$${pricing.rate}/${pricing.unit}`
                        : 'Rate not set'}
                      {pricing.source === 'override' && (
                        <Badge variant="secondary" className="ml-1 text-xs">
                          Override
                        </Badge>
                      )}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {tool.tool_type === 'metered' && workspaceType === 'managed' && (
                <ToolPricingOverrideDialog
                  workspaceId={workspaceId}
                  toolId={wt.tool_id}
                  toolName={tool.name}
                  currentOverride={wt.pricing_override}
                  onSaved={onUpdate}
                />
              )}
              <Switch
                checked={wt.is_enabled}
                onCheckedChange={(checked) => toggleTool(wt.tool_id, checked)}
                disabled={updating === wt.tool_id}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
