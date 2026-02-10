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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface InviteWorkspaceMemberDialogProps {
  workspaceId: string;
  onInvited: () => void;
}

export function InviteWorkspaceMemberDialog({
  workspaceId,
  onInvited,
}: InviteWorkspaceMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'user' | 'owner'>('user');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [inviteUrl, setInviteUrl] = useState('');

  function reset() {
    setEmail('');
    setRole('user');
    setError('');
    setInviteUrl('');
    setSaving(false);
  }

  async function handleCreate() {
    setSaving(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email || undefined,
          role,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setInviteUrl(data.invite_url);
        onInvited();
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
        <Button variant="outline" size="sm">
          Invite Member
        </Button>
      </DialogTrigger>
      <DialogContent>
        {inviteUrl ? (
          <>
            <DialogHeader>
              <DialogTitle>Invite Created</DialogTitle>
              <DialogDescription>
                Share this link with the user to join the workspace.
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
              <p className="text-sm text-muted-foreground">This link expires in 7 days.</p>
            </div>
            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Invite Member</DialogTitle>
              <DialogDescription>
                Generate an invite link for a new workspace member.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="invite-email">Email (optional)</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  If provided, only this email can use the invite.
                </p>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={role} onValueChange={(v) => setRole(v as 'user' | 'owner')}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="owner">Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? 'Creating...' : 'Create Invite'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
