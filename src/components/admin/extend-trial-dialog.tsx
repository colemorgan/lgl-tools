'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ExtendTrialDialogProps {
  userId: string;
  currentTrialEnd: string;
  onExtended: (newDate: string) => void;
}

export function ExtendTrialDialog({ userId, currentTrialEnd, onExtended }: ExtendTrialDialogProps) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState('15');
  const [saving, setSaving] = useState(false);

  async function handleExtend() {
    setSaving(true);
    const newDate = new Date();
    newDate.setDate(newDate.getDate() + parseInt(days));

    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trial_ends_at: newDate.toISOString(),
          subscription_status: 'trialing',
        }),
      });

      if (res.ok) {
        onExtended(newDate.toISOString());
        setOpen(false);
      }
    } catch (error) {
      console.error('Failed to extend trial:', error);
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="mt-2">
          Extend Trial
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Extend Trial</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Current trial ends</Label>
            <p className="text-sm text-muted-foreground">
              {currentTrialEnd ? new Date(currentTrialEnd).toLocaleString() : 'Not set'}
            </p>
          </div>
          <div>
            <Label htmlFor="days">Days from today</Label>
            <Input
              id="days"
              type="number"
              min="1"
              value={days}
              onChange={(e) => setDays(e.target.value)}
            />
          </div>
          <div className="text-sm text-muted-foreground">
            New trial end:{' '}
            {(() => {
              const d = new Date();
              d.setDate(d.getDate() + parseInt(days || '0'));
              return d.toLocaleDateString();
            })()}
          </div>
          <Button onClick={handleExtend} disabled={saving}>
            {saving ? 'Saving...' : 'Extend Trial'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
