'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';

export function CreateWorkspaceDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/workspace/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company_name: companyName.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create workspace');
        setCreating(false);
        return;
      }

      setOpen(false);
      router.refresh();
    } catch {
      setError('Something went wrong');
      setCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create a Workspace</DialogTitle>
          <DialogDescription>
            Set up a workspace to access metered tools like live streaming and
            invite team members.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="ws-name">Workspace Name</Label>
            <Input
              id="ws-name"
              placeholder="My Workspace"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="ws-company">Company Name (optional)</Label>
            <Input
              id="ws-company"
              placeholder="Acme Inc."
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : 'Create Workspace'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
