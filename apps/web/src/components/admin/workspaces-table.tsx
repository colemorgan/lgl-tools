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
import type { Workspace, WorkspaceStatus } from '@/types';

interface WorkspaceWithMeta extends Workspace {
  member_count: number;
  pending_charges_count: number;
}

const statusVariant: Record<WorkspaceStatus, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  suspended: 'secondary',
  closed: 'destructive',
};

export function WorkspacesTable() {
  const [workspaces, setWorkspaces] = useState<WorkspaceWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/workspaces')
      .then((res) => res.json())
      .then(setWorkspaces)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Pending Charges</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Created</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                Loading...
              </TableCell>
            </TableRow>
          ) : workspaces.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No workspaces yet
              </TableCell>
            </TableRow>
          ) : (
            workspaces.map((ws) => (
              <TableRow key={ws.id}>
                <TableCell className="font-medium">{ws.name}</TableCell>
                <TableCell className="text-muted-foreground">{ws.company_name || '--'}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[ws.status]}>{ws.status}</Badge>
                </TableCell>
                <TableCell>{ws.member_count}</TableCell>
                <TableCell>{ws.pending_charges_count}</TableCell>
                <TableCell>
                  {ws.stripe_payment_method_id ? (
                    <Badge variant="default">Saved</Badge>
                  ) : (
                    <Badge variant="outline">Not saved</Badge>
                  )}
                </TableCell>
                <TableCell>{new Date(ws.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/workspaces/${ws.id}`}>View</Link>
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
