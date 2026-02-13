'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ToolRecord } from '@/types';

export function ToolDetailView({ toolId }: { toolId: string }) {
  const router = useRouter();
  const [tool, setTool] = useState<ToolRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('');
  const [routePath, setRoutePath] = useState('');
  const [toolType, setToolType] = useState('standard');
  const [billingConfig, setBillingConfig] = useState('');
  const [isAdvertised, setIsAdvertised] = useState(true);
  const [isEnabled, setIsEnabled] = useState(true);
  const [tierAccess, setTierAccess] = useState('');
  const [requiresWorkspace, setRequiresWorkspace] = useState(false);
  const [sortOrder, setSortOrder] = useState(0);

  const fetchTool = useCallback(() => {
    fetch(`/api/admin/tools/${toolId}`)
      .then((res) => res.json())
      .then((data: ToolRecord) => {
        setTool(data);
        setName(data.name);
        setDescription(data.description);
        setCategory(data.category);
        setIcon(data.icon);
        setRoutePath(data.route_path ?? '');
        setToolType(data.tool_type);
        setBillingConfig(JSON.stringify(data.billing_config, null, 2));
        setIsAdvertised(data.is_advertised);
        setIsEnabled(data.is_enabled);
        setTierAccess(data.tier_access.join(', '));
        setRequiresWorkspace(data.requires_workspace);
        setSortOrder(data.sort_order);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [toolId]);

  useEffect(() => {
    fetchTool();
  }, [fetchTool]);

  async function handleSave() {
    setSaving(true);
    try {
      let parsedBillingConfig;
      try {
        parsedBillingConfig = JSON.parse(billingConfig);
      } catch {
        alert('Invalid JSON in billing config');
        setSaving(false);
        return;
      }

      const res = await fetch(`/api/admin/tools/${toolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          category,
          icon,
          route_path: routePath || null,
          tool_type: toolType,
          billing_config: parsedBillingConfig,
          is_advertised: isAdvertised,
          is_enabled: isEnabled,
          tier_access: tierAccess.split(',').map((s) => s.trim()).filter(Boolean),
          requires_workspace: requiresWorkspace,
          sort_order: sortOrder,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setTool(updated);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch {
      alert('Failed to save');
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!tool) {
    return <div className="text-destructive">Tool not found</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/admin/tools')}>
        &larr; Back to Tools
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{tool.name}</CardTitle>
            <Badge variant="outline" className="font-mono text-xs">{tool.slug}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Display Info */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <Input value={icon} onChange={(e) => setIcon(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Route Path</Label>
              <Input value={routePath} onChange={(e) => setRoutePath(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Sort Order</Label>
              <Input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label>Tool Type</Label>
              <Select value={toolType} onValueChange={setToolType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="metered">Metered</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Availability Toggles */}
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label>Advertised</Label>
              <Switch checked={isAdvertised} onCheckedChange={setIsAdvertised} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label>Enabled</Label>
              <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <Label>Requires Workspace</Label>
              <Switch checked={requiresWorkspace} onCheckedChange={setRequiresWorkspace} />
            </div>
          </div>

          {/* Tier Access */}
          <div className="space-y-2">
            <Label>Tier Access (comma-separated)</Label>
            <Input
              value={tierAccess}
              onChange={(e) => setTierAccess(e.target.value)}
              placeholder="active, trialing"
            />
          </div>

          {/* Billing Config */}
          <div className="space-y-2">
            <Label>Billing Config (JSON)</Label>
            <Textarea
              className="font-mono text-sm"
              rows={4}
              value={billingConfig}
              onChange={(e) => setBillingConfig(e.target.value)}
            />
          </div>

          {/* Metadata (read-only) */}
          <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
            <div>
              <Label className="text-muted-foreground">ID</Label>
              <p className="font-mono">{tool.id}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Created</Label>
              <p>{new Date(tool.created_at).toLocaleString()}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">Updated</Label>
              <p>{new Date(tool.updated_at).toLocaleString()}</p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
