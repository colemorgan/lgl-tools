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
import type { ChargeStatus } from '@/types';

interface ChargeWithWorkspace {
  id: string;
  billing_client_id: string;
  amount_cents: number;
  currency: string;
  description: string | null;
  scheduled_date: string;
  status: ChargeStatus;
  processed_at: string | null;
  workspace_id: string | null;
  workspace_name: string;
}

export default function BillingPipelinePage() {
  const [charges, setCharges] = useState<ChargeWithWorkspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetch('/api/admin/charges')
      .then((res) => res.json())
      .then(setCharges)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = statusFilter === 'all'
    ? charges
    : charges.filter((c) => c.status === statusFilter);

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-heading font-bold mb-6">Billing Pipeline</h1>

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
              <TableHead>Workspace</TableHead>
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
                    {charge.workspace_id ? (
                      <Link
                        href={`/admin/workspaces/${charge.workspace_id}`}
                        className="text-primary hover:underline"
                      >
                        {charge.workspace_name}
                      </Link>
                    ) : (
                      charge.workspace_name
                    )}
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
                    {charge.workspace_id && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/admin/workspaces/${charge.workspace_id}`}>View</Link>
                      </Button>
                    )}
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
