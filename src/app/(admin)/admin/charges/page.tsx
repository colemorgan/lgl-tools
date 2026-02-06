'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChargeStatusBadge } from '@/components/admin/charge-status-badge';
import Link from 'next/link';
import type { ScheduledCharge, BillingClient } from '@/types';

interface ChargeWithClient extends ScheduledCharge {
  billing_client: BillingClient & { user_email: string | null };
}

export default function AllChargesPage() {
  const [charges, setCharges] = useState<ChargeWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    // Fetch all clients and their charges
    fetch('/api/admin/billing-clients')
      .then((res) => res.json())
      .then(async (clients) => {
        const allCharges: ChargeWithClient[] = [];
        for (const client of clients) {
          const res = await fetch(`/api/admin/billing-clients/${client.id}/charges`);
          const clientCharges = await res.json();
          for (const charge of clientCharges) {
            allCharges.push({
              ...charge,
              billing_client: client,
            });
          }
        }
        allCharges.sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime());
        setCharges(allCharges);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter === 'all'
    ? charges
    : charges.filter((c) => c.status === statusFilter);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-heading font-bold mb-6">All Charges</h1>

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="succeeded">Succeeded</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Processed</TableHead>
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
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No charges found
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((charge) => (
                <TableRow key={charge.id}>
                  <TableCell>
                    <Link
                      href={`/admin/billing/${charge.billing_client_id}`}
                      className="text-primary hover:underline"
                    >
                      {charge.billing_client.name}
                    </Link>
                  </TableCell>
                  <TableCell>{charge.description || '-'}</TableCell>
                  <TableCell className="font-mono">
                    ${(charge.amount_cents / 100).toFixed(2)} {charge.currency.toUpperCase()}
                  </TableCell>
                  <TableCell>{new Date(charge.scheduled_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <ChargeStatusBadge status={charge.status} />
                  </TableCell>
                  <TableCell>
                    {charge.processed_at
                      ? new Date(charge.processed_at).toLocaleString()
                      : '-'}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/billing/${charge.billing_client_id}`}>View Client</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
