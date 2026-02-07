'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';

export function InviteClientDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

  function reset() {
    setName('');
    setEmail('');
    setNotes('');
    setError('');
    setInviteUrl('');
    setSaving(false);
  }

  async function handleCreate() {
    if (!name) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/billing-clients/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email || undefined,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInviteUrl(data.invite_url);
        onCreated?.();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create invite');
      }
    } catch {
      setError('Failed to create invite');
    }
    setSaving(false);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(inviteUrl);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
        if (!val) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline">Invite Client</Button>
      </DialogTrigger>
      <DialogContent>
        {inviteUrl ? (
          <>
            <DialogHeader>
              <DialogTitle>Invite Created</DialogTitle>
              <DialogDescription>
                Share this link with the client to complete registration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Invite Link</Label>
                <div className="mt-1 flex gap-2">
                  <Input value={inviteUrl} readOnly className="font-mono text-sm" />
                  <Button onClick={copyLink} variant="secondary">
                    Copy
                  </Button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                This link expires in 7 days.
              </p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite Client</DialogTitle>
              <DialogDescription>
                Create a billing client and generate an invite link. The client will register using
                this link.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-name">Company / Organization Name</Label>
                <Input
                  id="invite-name"
                  placeholder="Acme Corp"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="invite-email">Contact Email (optional)</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="contact@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  If provided, only this email can register via the invite.
                </p>
              </div>
              <div>
                <Label htmlFor="invite-notes">Notes (optional)</Label>
                <Textarea
                  id="invite-notes"
                  placeholder="Custom billing arrangement details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving || !name}>
                {saving ? 'Creating...' : 'Create Invite'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
