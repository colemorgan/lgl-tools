'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { BillingClient, BillingClientStatus } from '@/types';

interface BillingClientWithMeta extends BillingClient {
  user_email: string | null;
  pending_charges_count: number;
}

const statusVariant: Record<BillingClientStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending_setup: 'outline',
  active: 'default',
  paused: 'secondary',
  closed: 'destructive',
};

export function BillingClientsTable() {
  const [clients, setClients] = useState<BillingClientWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/billing-clients')
      .then((res) => res.json())
      .then(setClients)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Pending Charges</TableHead>
            <TableHead>Created</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No billing clients yet
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>
                  {client.user_email || (client.user_id ? '-' : (
                    <span className="text-muted-foreground italic">Invited</span>
                  ))}
                </TableCell>
                <TableCell>
                  <Badge variant={statusVariant[client.status]}>{client.status}</Badge>
                </TableCell>
                <TableCell>
                  {client.stripe_payment_method_id ? (
                    <Badge variant="default">Saved</Badge>
                  ) : (
                    <Badge variant="outline">Not saved</Badge>
                  )}
                </TableCell>
                <TableCell>{client.pending_charges_count}</TableCell>
                <TableCell>{new Date(client.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/billing/${client.id}`}>View</Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
