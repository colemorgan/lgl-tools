'use client';

import { useState } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { tools } from '@/config/tools';
import { getToolIcon } from '@/config/tools';
import type { WorkspaceTool } from '@/types';

interface ToolTogglesProps {
  workspaceId: string;
  workspaceTools: WorkspaceTool[];
  onUpdate: () => void;
}

export function ToolToggles({ workspaceId, workspaceTools, onUpdate }: ToolTogglesProps) {
  const [updating, setUpdating] = useState<string | null>(null);

  function isEnabled(toolSlug: string): boolean {
    const wt = workspaceTools.find((t) => t.tool_id === toolSlug);
    return wt?.enabled ?? false;
  }

  async function toggleTool(toolId: string, enabled: boolean) {
    setUpdating(toolId);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}/tools`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool_id: toolId, enabled }),
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
      {tools.map((tool) => {
        const Icon = getToolIcon(tool.icon);
        const enabled = isEnabled(tool.slug);
        return (
          <div
            key={tool.slug}
            className="flex items-center justify-between rounded-lg border p-4"
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="font-medium">{tool.name}</Label>
                <p className="text-xs text-muted-foreground">{tool.slug}</p>
              </div>
            </div>
            <Switch
              checked={enabled}
              onCheckedChange={(checked) => toggleTool(tool.slug, checked)}
              disabled={updating === tool.slug}
            />
          </div>
        );
      })}
    </div>
  );
}
