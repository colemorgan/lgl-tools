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
import { Textarea } from '@/components/ui/textarea';

interface AddChargeDialogProps {
  workspaceId: string;
  onCreated: () => void;
}

export function AddChargeDialog({ workspaceId, onCreated }: AddChargeDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleCreate() {
    if (!amount || !scheduledDate) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/workspaces/${workspaceId}/charges`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount_cents: Math.round(parseFloat(amount) * 100),
          description,
          scheduled_date: scheduledDate,
        }),
      });

      if (res.ok) {
        setOpen(false);
        setAmount('');
        setDescription('');
        setScheduledDate('');
        onCreated();
      }
    } catch (error) {
      console.error('Failed to create charge:', error);
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Charge</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Scheduled Charge</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="100.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Monthly retainer - January"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="scheduled_date">Scheduled Date</Label>
            <Input
              id="scheduled_date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>
          <Button onClick={handleCreate} disabled={saving || !amount || !scheduledDate}>
            {saving ? 'Creating...' : 'Create Charge'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
