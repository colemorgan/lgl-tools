'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export function CreateWorkspaceForm() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [type, setType] = useState<'self_serve' | 'managed'>('managed');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleCreate() {
    if (!name) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type }),
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

        <div className="space-y-3">
          <Label>Type</Label>
          <RadioGroup
            value={type}
            onValueChange={(v) => setType(v as 'self_serve' | 'managed')}
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="managed" id="type-managed" />
              <Label htmlFor="type-managed" className="font-normal cursor-pointer">
                Managed
                <span className="block text-xs text-muted-foreground">
                  Custom billing, admin-managed tools and users
                </span>
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="self_serve" id="type-self-serve" />
              <Label htmlFor="type-self-serve" className="font-normal cursor-pointer">
                Self-Serve
                <span className="block text-xs text-muted-foreground">
                  Standard subscription billing
                </span>
              </Label>
            </div>
          </RadioGroup>
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
