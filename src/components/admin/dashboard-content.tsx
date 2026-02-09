'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Users,
  DollarSign,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  UserPlus,
  CheckCircle2,
  XCircle,
  ChevronRight,
} from 'lucide-react';

interface DashboardStats {
  workspaces: {
    total: number;
    selfServe: number;
    managed: number;
    active: number;
  };
  users: {
    total: number;
    technician: number;
    freeTrial: number;
    workspaceMembers: number;
    expiredTrials: number;
    pastDue: number;
  };
  revenue: {
    customInvoicesThisMonth: number;
    customInvoicesLastMonth: number;
    meteredUsageThisMonth: number;
  };
  pendingChargesCount: number;
  upcomingCharges: {
    id: string;
    billing_client_id: string;
    billing_client_name: string;
    amount_cents: number;
    currency: string;
    description: string | null;
    scheduled_date: string;
  }[];
  recentActivity: {
    type: 'signup' | 'payment_succeeded' | 'payment_failed';
    description: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
  }[];
}

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(dateStr);
}

function RevenueChange({ current, previous }: { current: number; previous: number }) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0) {
    return (
      <span className="inline-flex items-center text-xs text-emerald-600">
        <ArrowUpRight className="h-3 w-3 mr-0.5" />
        New
      </span>
    );
  }
  const pct = ((current - previous) / previous) * 100;
  const isUp = pct >= 0;
  return (
    <span
      className={`inline-flex items-center text-xs ${isUp ? 'text-emerald-600' : 'text-red-500'}`}
    >
      {isUp ? (
        <ArrowUpRight className="h-3 w-3 mr-0.5" />
      ) : (
        <ArrowDownRight className="h-3 w-3 mr-0.5" />
      )}
      {Math.abs(pct).toFixed(0)}% vs last month
    </span>
  );
}

const activityConfig = {
  signup: {
    icon: UserPlus,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  payment_succeeded: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  payment_failed: {
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
  },
};

export function DashboardContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-24 text-muted-foreground">
        Failed to load dashboard data.
      </div>
    );
  }

  const totalRevenueThisMonth =
    stats.revenue.customInvoicesThisMonth + stats.revenue.meteredUsageThisMonth;
  const nextDueDate =
    stats.upcomingCharges.length > 0
      ? formatDate(stats.upcomingCharges[0].scheduled_date)
      : null;

  return (
    <div className="space-y-8">
      {/* Hero Stats Row */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Workspaces</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.workspaces.active}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.workspaces.selfServe} self-serve, {stats.workspaces.managed} managed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.users.technician} Technician, {stats.users.freeTrial} Free Trial
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCents(totalRevenueThisMonth)}</div>
            <div className="mt-1">
              <RevenueChange
                current={totalRevenueThisMonth}
                previous={stats.revenue.customInvoicesLastMonth}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Charges</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingChargesCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {nextDueDate ? `Next due ${nextDueDate}` : 'No pending charges'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
            <div>
              <p className="text-sm text-muted-foreground">Custom Invoices (this month)</p>
              <p className="text-xl font-semibold mt-1">
                {formatCents(stats.revenue.customInvoicesThisMonth)}
              </p>
              <RevenueChange
                current={stats.revenue.customInvoicesThisMonth}
                previous={stats.revenue.customInvoicesLastMonth}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Metered Usage (this month)</p>
              <p className="text-xl font-semibold mt-1">
                {formatCents(stats.revenue.meteredUsageThisMonth)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Technician Subscriptions ($9/mo)</p>
              <p className="text-xl font-semibold mt-1 text-muted-foreground">--</p>
              <span className="text-xs text-muted-foreground">Coming soon</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Upcoming Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Upcoming Invoices</CardTitle>
            <Link href="/admin/charges">
              <Button variant="ghost" size="sm" className="text-xs">
                View all
                <ChevronRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {stats.upcomingCharges.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No upcoming charges
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.upcomingCharges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/admin/billing`}
                          className="hover:underline"
                        >
                          {charge.billing_client_name}
                        </Link>
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-[200px] truncate">
                        {charge.description || '--'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCents(charge.amount_cents)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(charge.scheduled_date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentActivity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((event, i) => {
                  const config = activityConfig[event.type];
                  const Icon = config.icon;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${config.bg}`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm leading-snug">{event.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatRelativeTime(event.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/admin/users">
              <Button variant="outline" size="sm">
                <Users className="h-4 w-4 mr-2" />
                Users
              </Button>
            </Link>
            <Link href="/admin/billing">
              <Button variant="outline" size="sm">
                <DollarSign className="h-4 w-4 mr-2" />
                Billing
              </Button>
            </Link>
            <Link href="/admin/charges">
              <Button variant="outline" size="sm">
                <Clock className="h-4 w-4 mr-2" />
                Charges
              </Button>
            </Link>
            <Link href="/admin/workspaces">
              <Button variant="outline" size="sm">
                <Building2 className="h-4 w-4 mr-2" />
                Workspaces
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
