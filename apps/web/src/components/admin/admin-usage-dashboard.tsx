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
  workspace_id: string;
  workspace_name: string;
  tool_id: string;
  tool_slug: string;
  tool_name: string;
  total_quantity: number;
  total_cost: number;
  event_count: number;
}

interface AggregationResult {
  aggregates: UsageAggregate[];
  billing_period: string;
}

export function AdminUsageDashboard() {
  const now = new Date();
  const defaultPeriod = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [period, setPeriod] = useState(defaultPeriod);
  const [data, setData] = useState<AggregationResult | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/usage?period=${period}`)
      .then((res) => res.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [period]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const totalCost = data?.aggregates.reduce((sum, a) => sum + a.total_cost, 0) ?? 0;
  const totalEvents = data?.aggregates.reduce((sum, a) => sum + a.event_count, 0) ?? 0;

  // Group by workspace
  const byWorkspace = (data?.aggregates ?? []).reduce<Record<string, UsageAggregate[]>>((acc, a) => {
    if (!acc[a.workspace_name]) acc[a.workspace_name] = [];
    acc[a.workspace_name].push(a);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4">
        <div className="space-y-2">
          <Label>Billing Period</Label>
          <Input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-48"
          />
        </div>
      </div>

      {/* Platform Totals */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              ${totalCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usage Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalEvents.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Workspaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{Object.keys(byWorkspace).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Per-workspace breakdown */}
      {loading ? (
        <div className="text-muted-foreground py-8 text-center">Loading...</div>
      ) : Object.keys(byWorkspace).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No usage data for this period
          </CardContent>
        </Card>
      ) : (
        Object.entries(byWorkspace).map(([workspaceName, aggregates]) => {
          const wsTotal = aggregates.reduce((sum, a) => sum + a.total_cost, 0);
          return (
            <Card key={workspaceName}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{workspaceName}</CardTitle>
                  <Badge variant="secondary">${wsTotal.toFixed(2)}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tool</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Events</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aggregates.map((agg) => (
                      <TableRow key={agg.tool_id}>
                        <TableCell className="font-medium">{agg.tool_name}</TableCell>
                        <TableCell className="text-right">
                          {agg.total_quantity.toFixed(1)}
                        </TableCell>
                        <TableCell className="text-right">{agg.event_count}</TableCell>
                        <TableCell className="text-right">${agg.total_cost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
