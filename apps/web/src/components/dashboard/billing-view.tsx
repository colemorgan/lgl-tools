'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { WalkthroughTooltip } from '@/components/ui/walkthrough-tooltip';
import type { BillingClient, ScheduledCharge } from '@/types';

interface UsageData {
  period_start: string;
  period_end: string;
  total_minutes: number;
  total_cost_cents: number;
  streams: {
    stream_id: string;
    stream_name: string;
    minutes: number;
    cost_cents: number;
  }[];
}

interface BillingData {
  billing_client: BillingClient | null;
  charges: ScheduledCharge[];
}

interface BillingViewProps {
  isWorkspaceOwner?: boolean;
  showSetupWalkthrough?: boolean;
}

function formatCurrency(amountCents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountCents / 100);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

const WALKTHROUGH_DISMISSED_KEY = 'lgl_setup_walkthrough_dismissed';

export function BillingView({ isWorkspaceOwner, showSetupWalkthrough }: BillingViewProps) {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [tooltipDismissed, setTooltipDismissed] = useState(false);
  const addCardButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (sessionStorage.getItem(WALKTHROUGH_DISMISSED_KEY)) {
      setTooltipDismissed(true);
    }
  }, []);

  function dismissTooltip() {
    setTooltipDismissed(true);
    sessionStorage.setItem(WALKTHROUGH_DISMISSED_KEY, '1');
  }

  const hasCard = data?.billing_client?.stripe_payment_method_id;
  const showTooltip = !!showSetupWalkthrough && !loading && !tooltipDismissed && !hasCard;

  useEffect(() => {
    async function fetchBilling() {
      try {
        const res = await fetch('/api/billing');
        if (!res.ok) throw new Error('Failed to fetch billing data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    async function fetchUsage() {
      try {
        const res = await fetch('/api/streams/usage');
        if (res.ok) {
          setUsage(await res.json());
        }
      } catch {
        // Usage is non-critical — silently fail
      }
    }
    fetchBilling();
    fetchUsage();
  }, []);

  async function handleUpdatePaymentMethod() {
    setUpdatingPayment(true);
    setPaymentError(null);
    try {
      const res = await fetch('/api/workspace/update-payment-method', {
        method: 'POST',
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        setPaymentError(json.error || 'Failed to create setup session');
      }
    } catch {
      setPaymentError('Failed to update payment method');
    }
    setUpdatingPayment(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data?.billing_client) {
    // Workspace owners can set up billing themselves
    if (isWorkspaceOwner) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Set Up Billing</CardTitle>
            <CardDescription>
              Add a payment method to get started with billing for your workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {paymentError && (
              <p className="text-sm text-destructive">{paymentError}</p>
            )}
            <div className={showTooltip ? 'relative z-[51]' : undefined}>
              <Button
                ref={addCardButtonRef}
                onClick={handleUpdatePaymentMethod}
                disabled={updatingPayment}
              >
                {updatingPayment ? 'Loading...' : 'Add Payment Method'}
              </Button>
            </div>
            <WalkthroughTooltip
              targetRef={addCardButtonRef}
              message="Add a payment method to activate your workspace. Your card will be used for scheduled charges."
              onDismiss={dismissTooltip}
              show={showTooltip}
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">
            No billing account found. If you believe this is an error, please contact support.
          </p>
        </CardContent>
      </Card>
    );
  }

  const upcomingCharges = data.charges.filter(
    (c) => c.status === 'pending' || c.status === 'processing'
  );
  const paidCharges = data.charges.filter((c) => c.status === 'succeeded');
  const failedCharges = data.charges.filter((c) => c.status === 'failed');

  const totalUpcoming = upcomingCharges.reduce((sum, c) => sum + c.amount_cents, 0);
  const totalPaid = paidCharges.reduce((sum, c) => sum + c.amount_cents, 0);

  return (
    <div className="space-y-8">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming</CardDescription>
            <CardTitle className="text-2xl font-mono">
              {formatCurrency(totalUpcoming, 'usd')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {upcomingCharges.length} pending charge{upcomingCharges.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Paid</CardDescription>
            <CardTitle className="text-2xl font-mono">
              {formatCurrency(totalPaid, 'usd')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              {paidCharges.length} invoice{paidCharges.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Account Status</CardDescription>
            <CardTitle className="text-2xl">
              <Badge
                variant={
                  data.billing_client.status === 'active'
                    ? 'default'
                    : data.billing_client.status === 'paused'
                      ? 'secondary'
                      : 'outline'
                }
              >
                {data.billing_client.status === 'pending_setup'
                  ? 'Pending Setup'
                  : data.billing_client.status.charAt(0).toUpperCase() +
                    data.billing_client.status.slice(1)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Member since {formatDate(data.billing_client.created_at)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method Card (workspace owners only) */}
      {isWorkspaceOwner && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>Card on file for scheduled charges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className={`flex items-center justify-between${showTooltip ? ' relative z-[51]' : ''}`}>
              <div className="flex items-center gap-2">
                {data.billing_client.stripe_payment_method_id ? (
                  <Badge variant="default">Card on file</Badge>
                ) : (
                  <Badge variant="outline">No card saved</Badge>
                )}
              </div>
              <Button
                ref={addCardButtonRef}
                variant="outline"
                size="sm"
                onClick={handleUpdatePaymentMethod}
                disabled={updatingPayment}
              >
                {updatingPayment
                  ? 'Loading...'
                  : data.billing_client.stripe_payment_method_id
                    ? 'Update Card'
                    : 'Add Card'}
              </Button>
            </div>
            {paymentError && (
              <p className="text-sm text-destructive">{paymentError}</p>
            )}
            <WalkthroughTooltip
              targetRef={addCardButtonRef}
              message="Add a payment method to activate your workspace. Your card will be used for scheduled charges."
              onDismiss={dismissTooltip}
              show={showTooltip}
            />
          </CardContent>
        </Card>
      )}

      {/* Failed Charges Alert */}
      {failedCharges.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="font-semibold text-destructive">Payment Issues</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {failedCharges.length} payment{failedCharges.length !== 1 ? 's' : ''} failed.
            Please contact support or update your payment method.
          </p>
        </div>
      )}

      {/* Usage This Period */}
      {usage && usage.total_minutes > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage This Period</CardTitle>
            <CardDescription>
              Streaming usage from {formatDate(usage.period_start)} to {formatDate(usage.period_end)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 mb-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Minutes Watched</p>
                <p className="text-2xl font-mono font-semibold">{usage.total_minutes.toFixed(1)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Cost</p>
                <p className="text-2xl font-mono font-semibold">
                  {formatCurrency(usage.total_cost_cents, 'usd')}
                </p>
              </div>
            </div>
            {usage.streams.length > 1 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stream</TableHead>
                      <TableHead className="text-right">Minutes</TableHead>
                      <TableHead className="text-right">Cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usage.streams
                      .filter((s) => s.minutes > 0)
                      .map((s) => (
                        <TableRow key={s.stream_id}>
                          <TableCell>{s.stream_name}</TableCell>
                          <TableCell className="text-right font-mono">
                            {s.minutes.toFixed(1)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(s.cost_cents, 'usd')}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Charges */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Bills</CardTitle>
          <CardDescription>Scheduled charges that have not yet been processed</CardDescription>
        </CardHeader>
        <CardContent>
          {upcomingCharges.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No upcoming charges
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingCharges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell>{charge.description || 'Scheduled charge'}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(charge.amount_cents, charge.currency)}
                      </TableCell>
                      <TableCell>{formatDate(charge.scheduled_date)}</TableCell>
                      <TableCell>
                        <Badge variant={charge.status === 'processing' ? 'secondary' : 'outline'}>
                          {charge.status === 'processing' ? 'Processing' : 'Scheduled'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paid Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Paid Invoices</CardTitle>
          <CardDescription>Charges that have been successfully processed</CardDescription>
        </CardHeader>
        <CardContent>
          {paidCharges.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No paid invoices yet
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Paid On</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidCharges.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell>{charge.description || 'Charge'}</TableCell>
                      <TableCell className="font-mono">
                        {formatCurrency(charge.amount_cents, charge.currency)}
                      </TableCell>
                      <TableCell>{formatDate(charge.scheduled_date)}</TableCell>
                      <TableCell>
                        {charge.processed_at ? formatDate(charge.processed_at) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {charge.stripe_invoice_url && (
                            <Button variant="outline" size="sm" asChild>
                              <a
                                href={charge.stripe_invoice_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                {charge.stripe_invoice_id ? 'View Invoice' : 'View Receipt'}
                              </a>
                            </Button>
                          )}
                          {charge.stripe_invoice_pdf && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={charge.stripe_invoice_pdf}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Download PDF
                              </a>
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
