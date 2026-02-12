'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface AggregationResult {
  aggregates: UsageAggregate[];
  billing_period: string;
}

export function WorkspaceUsage() {
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [period, setPeriod] = useState(defaultPeriod);
  const [data, setData] = useState<AggregationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(() => {
    fetch(`/api/usage?period=${period}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    fetchUsage();

    // Poll every 2-3 minutes
    const interval = setInterval(fetchUsage, 150_000);
    return () => clearInterval(interval);
  }, [fetchUsage]);

  const totalCost = data?.aggregates.reduce((sum, a) => sum + a.total_cost, 0) ?? 0;
  const hasData = (data?.aggregates.length ?? 0) > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Usage</CardTitle>
          <div className="flex items-center gap-2">
            <Label className="text-sm text-muted-foreground sr-only">Period</Label>
            <Input
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-40 h-8 text-sm"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-muted-foreground text-sm py-4 text-center">Loading...</div>
        ) : !hasData ? (
          <div className="text-muted-foreground text-sm py-4 text-center">
            No usage recorded for this period
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.aggregates.map((agg) => (
                  <TableRow key={agg.tool_slug}>
                    <TableCell className="font-medium">{agg.tool_name}</TableCell>
                    <TableCell className="text-right">
                      {agg.total_quantity.toFixed(1)}
                    </TableCell>
                    <TableCell className="text-right">
                      {agg.total_cost > 0 ? `$${agg.total_cost.toFixed(2)}` : 'Included'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end">
              <Badge variant="secondary" className="text-sm">
                Total: ${totalCost.toFixed(2)}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
