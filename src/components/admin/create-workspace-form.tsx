'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { tools } from '@/config/tools';
import { getToolIcon } from '@/config/tools';

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [enabledTools, setEnabledTools] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    tools.forEach((tool) => {
      initial[tool.slug] = tool.status === 'available';
    });
    return initial;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleTool(slug: string) {
    setEnabledTools((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  async function handleCreate() {
    if (!name) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contact_email: contactEmail || null,
          contact_phone: contactPhone || null,
          notes: notes || null,
          tools: enabledTools,
        }),
      });

      if (res.ok) {
        const workspace = await res.json();
        router.push(`/admin/workspaces/${workspace.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create workspace');
      }
    } catch {
      setError('Failed to create workspace');
    }
    setSaving(false);
  }

  return (
    <Card>
      <CardContent className="pt-6 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="ws-name">Workspace Name</Label>
          <Input
            id="ws-name"
            placeholder="Acme Productions"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ws-email">Contact Email</Label>
          <Input
            id="ws-email"
            type="email"
            placeholder="billing@acme.com"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ws-phone">Contact Phone</Label>
          <Input
            id="ws-phone"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="ws-notes">Notes</Label>
          <Textarea
            id="ws-notes"
            placeholder="Custom billing arrangement details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <Label>Enabled Tools</Label>
          <div className="grid gap-3 sm:grid-cols-2">
            {tools.map((tool) => {
              const Icon = getToolIcon(tool.icon);
              return (
                <label
                  key={tool.slug}
                  className="flex items-center gap-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                >
                  <Checkbox
                    checked={enabledTools[tool.slug] ?? false}
                    onCheckedChange={() => toggleTool(tool.slug)}
                  />
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">{tool.name}</span>
                    <p className="text-xs text-muted-foreground">{tool.description}</p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-4">
          <Button onClick={handleCreate} disabled={saving || !name}>
            {saving ? 'Creating...' : 'Create Workspace'}
          </Button>
          <Button variant="ghost" onClick={() => router.push('/admin/workspaces')}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
