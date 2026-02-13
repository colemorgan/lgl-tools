import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { aggregateUsageForBilling, markEventsAsBilled } from '@lgl/usage-tracking';
import { stripe } from '@/lib/stripe';

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Process the previous month's billing period
    const now = new Date();
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const billingPeriod = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}`;

    const { aggregates } = await aggregateUsageForBilling(supabase, billingPeriod);

    const results: Array<{
      workspace_id: string;
      tool_slug: string;
      total_cost: number;
      action: string;
    }> = [];

    // Group aggregates by workspace to create one invoice per workspace
    const byWorkspace = new Map<string, typeof aggregates>();
    for (const agg of aggregates) {
      if (agg.total_cost <= 0) continue;
      const existing = byWorkspace.get(agg.workspace_id) ?? [];
      existing.push(agg);
      byWorkspace.set(agg.workspace_id, existing);
    }

    for (const [workspaceId, workspaceAggs] of Array.from(byWorkspace.entries())) {
      // Get workspace to determine billing path
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('type, stripe_customer_id')
        .eq('id', workspaceId)
        .single();

      if (!workspace) continue;

      if (workspace.type === 'self_serve' && workspace.stripe_customer_id) {
        // Auto-charge self-serve workspaces via Stripe — one consolidated invoice
        try {
          // Create all line items first
          for (const agg of workspaceAggs) {
            const amountCents = Math.round(agg.total_cost * 100);
            await stripe.invoiceItems.create({
              customer: workspace.stripe_customer_id,
              amount: amountCents,
              currency: 'usd',
              description: `${agg.tool_name} usage: ${agg.total_quantity.toFixed(1)} ${agg.tool_slug === 'live-stream' ? 'minutes' : 'units'} (${billingPeriod})`,
            });
          }

          // Create and finalize a single invoice for all items
          const invoice = await stripe.invoices.create({
            customer: workspace.stripe_customer_id,
            auto_advance: true,
            collection_method: 'charge_automatically',
            pending_invoice_items_behavior: 'include',
          });

          await stripe.invoices.finalizeInvoice(invoice.id);

          // Mark all tool events as billed
          for (const agg of workspaceAggs) {
            await markEventsAsBilled(supabase, billingPeriod, agg.workspace_id, agg.tool_id);
            results.push({
              workspace_id: agg.workspace_id,
              tool_slug: agg.tool_slug,
              total_cost: agg.total_cost,
              action: `invoiced:${invoice.id}`,
            });
          }
        } catch (stripeError) {
          console.error(`Stripe billing error for workspace ${workspaceId}:`, stripeError);
          for (const agg of workspaceAggs) {
            results.push({
              workspace_id: agg.workspace_id,
              tool_slug: agg.tool_slug,
              total_cost: agg.total_cost,
              action: 'stripe_error',
            });
          }
        }
      } else {
        // Managed workspaces: log summary for admin review
        for (const agg of workspaceAggs) {
          results.push({
            workspace_id: agg.workspace_id,
            tool_slug: agg.tool_slug,
            total_cost: agg.total_cost,
            action: 'logged_for_review',
          });
        }
      }
    }

    console.log(`Usage billing cron completed for ${billingPeriod}:`, results);

    return NextResponse.json({
      billing_period: billingPeriod,
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error('Usage billing cron error:', error);
    return NextResponse.json({ error: 'Failed to process usage billing' }, { status: 500 });
  }
}
