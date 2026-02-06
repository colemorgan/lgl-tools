'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UserOption {
  id: string;
  full_name: string | null;
  email: string | null;
}

export function CreateBillingClientForm() {
  const router = useRouter();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/users?limit=200')
      .then((res) => res.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, []);

  async function handleCreate() {
    if (!selectedUserId || !name) return;

    setSaving(true);
    setError('');

    try {
      const res = await fetch('/api/admin/billing-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUserId,
          name,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        const client = await res.json();
        router.push(`/admin/billing/${client.id}`);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create billing client');
      }
    } catch {
      setError('Failed to create billing client');
    }
    setSaving(false);
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Create Billing Client</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Select User</Label>
          {loadingUsers ? (
            <p className="text-sm text-muted-foreground">Loading users...</p>
          ) : (
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.full_name || user.email || user.id}
                    {user.email && user.full_name ? ` (${user.email})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div>
          <Label htmlFor="name">Client Name</Label>
          <Input
            id="name"
            placeholder="Acme Corp"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea
            id="notes"
            placeholder="Custom billing arrangement details..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <div className="flex gap-4">
          <Button onClick={handleCreate} disabled={saving || !selectedUserId || !name}>
            {saving ? 'Creating...' : 'Create Client'}
          </Button>
          <Button variant="ghost" onClick={() => router.push('/admin/billing')}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
