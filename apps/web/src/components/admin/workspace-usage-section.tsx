'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UsageAggregate {
  tool_name: string;
  tool_slug: string;
  total_quantity: number;
  total_cost: number;
  event_count: number;
}

interface WorkspaceUsageSectionProps {
  workspaceId: string;
}

export function WorkspaceUsageSection({ workspaceId }: WorkspaceUsageSectionProps) {
  const now = new Date();
  const currentPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [aggregates, setAggregates] = useState<UsageAggregate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/usage?period=${currentPeriod}`)
      .then((res) => res.json())
      .then((data) => {
        const filtered = (data.aggregates ?? []).filter(
          (a: { workspace_id: string }) => a.workspace_id === workspaceId
        );
        setAggregates(filtered);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [workspaceId, currentPeriod]);

  const totalCost = aggregates.reduce((sum, a) => sum + a.total_cost, 0);

  if (loading) {
    return <div className="text-muted-foreground text-sm py-4">Loading usage...</div>;
  }

  if (aggregates.length === 0) {
    return (
      <div className="text-muted-foreground text-sm py-4 text-center">
        No usage this period
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Current period: {currentPeriod}</span>
        <Badge variant="secondary">${totalCost.toFixed(2)}</Badge>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tool</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aggregates.map((agg) => (
            <TableRow key={agg.tool_slug}>
              <TableCell className="font-medium">{agg.tool_name}</TableCell>
              <TableCell className="text-right">{agg.total_quantity.toFixed(1)}</TableCell>
              <TableCell className="text-right">${agg.total_cost.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
