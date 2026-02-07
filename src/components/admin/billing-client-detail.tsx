'use client';

import { useEffect, useState, useCallback } from 'react';
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
import { ChargesTable } from './charges-table';
import { AddChargeDialog } from './add-charge-dialog';
import { Input } from '@/components/ui/input';
import type { BillingClient, ClientInvite, ScheduledCharge } from '@/types';

interface BillingClientDetail extends BillingClient {
  user_email: string | null;
  charges: ScheduledCharge[];
  invite: ClientInvite | null;
}

export function BillingClientDetailView({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [client, setClient] = useState<BillingClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);

  const fetchClient = useCallback(() => {
    fetch(`/api/admin/billing-clients/${clientId}`)
      .then((res) => res.json())
      .then(setClient)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [clientId]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  async function updateStatus(status: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/billing-clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setClient((prev) => prev ? { ...prev, ...updated } : prev);
      }
    } catch (error) {
      console.error('Failed to update status:', error);
    }
    setSaving(false);
  }

  async function generatePaymentLink() {
    setGeneratingLink(true);
    try {
      const res = await fetch(`/api/admin/billing-clients/${clientId}/send-payment-link`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.url) {
        await navigator.clipboard.writeText(data.url);
        alert('Payment link copied to clipboard!');
      } else {
        alert(data.error || 'Failed to generate link');
      }
    } catch (error) {
      console.error('Failed to generate payment link:', error);
    }
    setGeneratingLink(false);
  }

  async function triggerCharge(chargeId: string) {
    if (!confirm('Charge the client now?')) return;
    try {
      const res = await fetch(`/api/admin/billing-clients/${clientId}/charges/${chargeId}/trigger`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchClient();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to trigger charge');
      }
    } catch (error) {
      console.error('Failed to trigger charge:', error);
    }
  }

  async function cancelCharge(chargeId: string) {
    if (!confirm('Cancel this charge?')) return;
    try {
      const res = await fetch(`/api/admin/billing-clients/${clientId}/charges/${chargeId}/cancel`, {
        method: 'POST',
      });
      if (res.ok) {
        fetchClient();
      }
    } catch (error) {
      console.error('Failed to cancel charge:', error);
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Loading...</div>;
  }

  if (!client) {
    return <div className="text-destructive">Billing client not found</div>;
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.push('/admin/billing')}>
        &larr; Back to Billing Clients
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{client.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-sm font-medium text-muted-foreground">User Email</label>
              <p>{client.user_email || (client.user_id ? '-' : 'Pending invite')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-1">
                <Select
                  value={client.status}
                  onValueChange={updateStatus}
                  disabled={saving}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending_setup">Pending Setup</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Stripe Customer</label>
              <p className="font-mono text-sm">{client.stripe_customer_id || 'Not linked'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
              <p>
                {client.stripe_payment_method_id ? (
                  <Badge variant="default">Saved</Badge>
                ) : (
                  <Badge variant="outline">Not saved</Badge>
                )}
              </p>
            </div>
            {client.notes && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Notes</label>
                <p className="text-sm">{client.notes}</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={generatePaymentLink}
              disabled={generatingLink}
              variant="outline"
            >
              {generatingLink ? 'Generating...' : 'Generate Payment Link'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {client.invite && !client.invite.accepted_at && (
        <Card>
          <CardHeader>
            <CardTitle>Invite</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Invite Link</label>
              <div className="mt-1 flex gap-2">
                <Input
                  value={`${window.location.origin}/invite/${client.invite.token}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="secondary"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `${window.location.origin}/invite/${client.invite!.token}`
                    )
                  }
                >
                  Copy
                </Button>
              </div>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              {client.invite.email && <span>Restricted to: {client.invite.email}</span>}
              <span>
                Expires: {new Date(client.invite.expires_at).toLocaleDateString()}
              </span>
              {new Date(client.invite.expires_at) < new Date() && (
                <Badge variant="destructive">Expired</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {client.invite?.accepted_at && (
        <Card>
          <CardHeader>
            <CardTitle>Invite</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="default">Accepted</Badge>
              <span className="text-muted-foreground">
                on {new Date(client.invite.accepted_at).toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Scheduled Charges</CardTitle>
          <AddChargeDialog clientId={clientId} onCreated={fetchClient} />
        </CardHeader>
        <CardContent>
          <ChargesTable
            charges={client.charges}
            onTrigger={triggerCharge}
            onCancel={cancelCharge}
          />
        </CardContent>
      </Card>
    </div>
  );
}
