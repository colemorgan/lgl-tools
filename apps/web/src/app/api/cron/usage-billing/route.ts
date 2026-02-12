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

    for (const agg of aggregates) {
      if (agg.total_cost <= 0) continue;

      // Get workspace to determine billing path
      const { data: workspace } = await supabase
        .from('workspaces')
        .select('type, stripe_customer_id')
        .eq('id', agg.workspace_id)
        .single();

      if (!workspace) continue;

      if (workspace.type === 'self_serve' && workspace.stripe_customer_id) {
        // Auto-charge self-serve workspaces via Stripe
        try {
          const amountCents = Math.round(agg.total_cost * 100);

          await stripe.invoiceItems.create({
            customer: workspace.stripe_customer_id,
            amount: amountCents,
            currency: 'usd',
            description: `${agg.tool_name} usage: ${agg.total_quantity.toFixed(1)} ${agg.tool_slug === 'live-stream' ? 'minutes' : 'units'} (${billingPeriod})`,
          });

          const invoice = await stripe.invoices.create({
            customer: workspace.stripe_customer_id,
            auto_advance: true,
            collection_method: 'charge_automatically',
            pending_invoice_items_behavior: 'include',
          });

          await stripe.invoices.finalizeInvoice(invoice.id);

          await markEventsAsBilled(supabase, billingPeriod, agg.workspace_id, agg.tool_id);

          results.push({
            workspace_id: agg.workspace_id,
            tool_slug: agg.tool_slug,
            total_cost: agg.total_cost,
            action: `invoiced:${invoice.id}`,
          });
        } catch (stripeError) {
          console.error(`Stripe billing error for workspace ${agg.workspace_id}:`, stripeError);
          results.push({
            workspace_id: agg.workspace_id,
            tool_slug: agg.tool_slug,
            total_cost: agg.total_cost,
            action: 'stripe_error',
          });
        }
      } else {
        // Managed workspaces: log summary for admin review
        results.push({
          workspace_id: agg.workspace_id,
          tool_slug: agg.tool_slug,
          total_cost: agg.total_cost,
          action: 'logged_for_review',
        });
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
