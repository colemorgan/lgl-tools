'use client';

import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ChargeStatusBadge } from './charge-status-badge';
import type { ScheduledCharge } from '@/types';

interface ChargesTableProps {
  charges: ScheduledCharge[];
  onTrigger?: (chargeId: string) => void;
  onCancel?: (chargeId: string) => void;
  showClient?: boolean;
  clientName?: string;
}

export function ChargesTable({ charges, onTrigger, onCancel, showClient, clientName }: ChargesTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {showClient && <TableHead>Client</TableHead>}
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Processed</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {charges.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showClient ? 7 : 6} className="text-center py-8 text-muted-foreground">
                No charges
              </TableCell>
            </TableRow>
          ) : (
            charges.map((charge) => (
              <TableRow key={charge.id}>
                {showClient && <TableCell>{clientName || '-'}</TableCell>}
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
                  <div className="flex gap-2">
                    {charge.status === 'pending' && onTrigger && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTrigger(charge.id)}
                      >
                        Trigger Now
                      </Button>
                    )}
                    {charge.status === 'pending' && onCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(charge.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
