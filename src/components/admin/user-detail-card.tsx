'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ExtendTrialDialog } from './extend-trial-dialog';
import type { Profile } from '@/types';

interface UserWithEmail extends Profile {
  email: string | null;
}

export function UserDetailCard({ userId }: { userId: string }) {
  const router = useRouter();
  const [user, setUser] = useState<UserWithEmail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${userId}`)
      .then((res) => res.json())
      .then(setUser)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  async function updateField(field: string, value: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
      const updated = await res.json();
      if (res.ok) {
        setUser((prev) => prev ? { ...prev, ...updated } : prev);
      }
    } catch (error) {
      console.error('Failed to update:', error);
    }
    setSaving(false);
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!user) {
    return <div className="text-destructive">User not found</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/admin/users')}>
        &larr; Back to Users
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{user.full_name || 'Unnamed User'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p>{user.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">User ID</label>
              <p className="font-mono text-sm">{user.id}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Stripe Customer</label>
              <p className="font-mono text-sm">{user.stripe_customer_id || 'Not linked'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p>{new Date(user.created_at).toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Select
                  value={user.subscription_status}
                  onValueChange={(v) => updateField('subscription_status', v)}
                  disabled={saving}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="trialing">Trialing</SelectItem>
                    <SelectItem value="expired_trial">Expired Trial</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Trial Ends</label>
              <p>{user.trial_ends_at ? new Date(user.trial_ends_at).toLocaleString() : '-'}</p>
              <ExtendTrialDialog
                userId={userId}
                currentTrialEnd={user.trial_ends_at}
                onExtended={(newDate) => setUser((prev) => prev ? { ...prev, trial_ends_at: newDate } : prev)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Badge variant={user.role === 'admin' ? 'default' : 'outline'}>
              {user.role}
            </Badge>
            <Select
              value={user.role}
              onValueChange={(v) => updateField('role', v)}
              disabled={saving}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
