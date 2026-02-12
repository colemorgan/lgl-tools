'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ToolPricingOverrideDialogProps {
  workspaceId: string;
  toolId: string;
  toolName: string;
  currentOverride: Record<string, unknown> | null;
  onSaved: () => void;
}

export function ToolPricingOverrideDialog({
  workspaceId,
  toolId,
  toolName,
  currentOverride,
  onSaved,
}: ToolPricingOverrideDialogProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rate, setRate] = useState(
    currentOverride?.rate != null ? String(currentOverride.rate) : ''
  );
  const [unit, setUnit] = useState(
    (currentOverride?.unit as string) ?? 'minute'
  );
  const [description, setDescription] = useState(
    (currentOverride?.description as string) ?? ''
  );

  async function handleSave() {
    setSaving(true);
    try {
      const pricingOverride = rate
        ? {
            type: 'metered',
            rate: parseFloat(rate),
            unit,
            description: description || undefined,
          }
        : null;

      const res = await fetch(
        `/api/admin/workspaces/${workspaceId}/tools/${toolId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pricing_override: pricingOverride }),
        }
      );

      if (res.ok) {
        onSaved();
        setOpen(false);
      }
    } catch (error) {
      console.error('Failed to save pricing override:', error);
    }
    setSaving(false);
  }

  async function handleClear() {
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/workspaces/${workspaceId}/tools/${toolId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pricing_override: null }),
        }
      );

      if (res.ok) {
        setRate('');
        setDescription('');
        onSaved();
        setOpen(false);
      }
    } catch (error) {
      console.error('Failed to clear pricing override:', error);
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Edit Pricing
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pricing Override: {toolName}</DialogTitle>
          <DialogDescription>
            Set custom pricing for this tool in this workspace. Leave rate blank
            and clear to use the global default.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Rate (cost per unit)</Label>
            <Input
              type="number"
              step="0.001"
              placeholder="e.g. 0.002"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Unit</Label>
            <Input
              placeholder="minute"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Input
              placeholder="Custom rate for this workspace"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-between">
          <Button variant="ghost" onClick={handleClear} disabled={saving}>
            Clear Override
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
