import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/resend';
import { stripe } from '@/lib/stripe';
import TrialEndingEmail from '../../../../../emails/trial-ending';
import TrialExpiredEmail from '../../../../../emails/trial-expired';
import ChargeFailedEmail from '../../../../../emails/charge-failed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Verify the request is from Vercel Cron
function isValidCronRequest(request: Request): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET environment variable not set');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(request: Request) {
  // Verify authorization
  if (!isValidCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date();

  const results = {
    trialEndingEmails: 0,
    trialExpiredEmails: 0,
    statusUpdates: 0,
    chargesProcessed: 0,
    chargesFailed: 0,
    errors: [] as string[],
  };

  try {
    // 1. Find users with trials ending in ~3 days (between 2.5 and 3.5 days)
    // This ensures we only send the email once per day even if cron runs multiple times
    const twoAndHalfDaysFromNow = new Date(now.getTime() + 2.5 * 24 * 60 * 60 * 1000);
    const threeAndHalfDaysFromNow = new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000);

    const { data: trialsEndingSoon, error: endingSoonError } = await supabase
      .from('profiles')
      .select('id, full_name, trial_ends_at')
      .eq('subscription_status', 'trialing')
      .gte('trial_ends_at', twoAndHalfDaysFromNow.toISOString())
      .lt('trial_ends_at', threeAndHalfDaysFromNow.toISOString());

    if (endingSoonError) {
      results.errors.push(`Error fetching trials ending soon: ${endingSoonError.message}`);
    } else if (trialsEndingSoon) {
      // Get user emails from auth.users
      for (const profile of trialsEndingSoon) {
        const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);

        if (userError || !userData.user?.email) {
          results.errors.push(`Error fetching email for user ${profile.id}`);
          continue;
        }

        const trialEndsAt = new Date(profile.trial_ends_at);
        const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));

        try {
          await sendEmail({
            to: userData.user.email,
            subject: `Your LGL Tools trial ends in ${daysRemaining} days`,
            react: TrialEndingEmail({
              userName: profile.full_name || 'there',
              daysRemaining,
            }),
          });
          results.trialEndingEmails++;
        } catch (emailError) {
          results.errors.push(`Error sending trial ending email to ${profile.id}: ${emailError}`);
        }
      }
    }

    // 2. Find and update expired trials
    const { data: expiredTrials, error: expiredError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('subscription_status', 'trialing')
      .lt('trial_ends_at', now.toISOString());

    if (expiredError) {
      results.errors.push(`Error fetching expired trials: ${expiredError.message}`);
    } else if (expiredTrials && expiredTrials.length > 0) {
      // Update all expired trials to expired_trial status
      const expiredIds = expiredTrials.map((p) => p.id);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ subscription_status: 'expired_trial' })
        .in('id', expiredIds);

      if (updateError) {
        results.errors.push(`Error updating expired trials: ${updateError.message}`);
      } else {
        results.statusUpdates = expiredTrials.length;

        // Send expired trial emails
        for (const profile of expiredTrials) {
          const { data: userData, error: userError } = await supabase.auth.admin.getUserById(profile.id);

          if (userError || !userData.user?.email) {
            results.errors.push(`Error fetching email for expired user ${profile.id}`);
            continue;
          }

          try {
            await sendEmail({
              to: userData.user.email,
              subject: 'Your LGL Tools trial has expired',
              react: TrialExpiredEmail({
                userName: profile.full_name || 'there',
              }),
            });
            results.trialExpiredEmails++;
          } catch (emailError) {
            results.errors.push(`Error sending trial expired email to ${profile.id}: ${emailError}`);
          }
        }
      }
    }

    // 3. Process scheduled charges due today or earlier
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD

    const { data: dueCharges, error: dueChargesError } = await supabase
      .from('scheduled_charges')
      .select('*, billing_clients!inner(id, user_id, stripe_customer_id, stripe_payment_method_id, status)')
      .eq('status', 'pending')
      .lte('scheduled_date', today);

    if (dueChargesError) {
      results.errors.push(`Error fetching due charges: ${dueChargesError.message}`);
    } else if (dueCharges && dueCharges.length > 0) {
      for (const charge of dueCharges) {
        const client = charge.billing_clients as unknown as {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_payment_method_id: string | null;
          status: string;
        };

        // Skip if client is not active or has no saved payment method
        if (client.status !== 'active' || !client.stripe_customer_id || !client.stripe_payment_method_id) {
          continue;
        }

        // Mark as processing
        await supabase
          .from('scheduled_charges')
          .update({ status: 'processing' })
          .eq('id', charge.id);

        try {
          // Create a Stripe Invoice for professional invoicing
          await stripe.invoiceItems.create({
            customer: client.stripe_customer_id,
            amount: charge.amount_cents,
            currency: charge.currency,
            description: charge.description || 'Scheduled charge',
          });

          const invoice = await stripe.invoices.create({
            customer: client.stripe_customer_id,
            default_payment_method: client.stripe_payment_method_id,
            auto_advance: true,
            collection_method: 'charge_automatically',
            metadata: {
              billing_client_id: client.id,
              scheduled_charge_id: charge.id,
              supabase_user_id: client.user_id,
            },
          });

          const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id);
          const paidInvoice = await stripe.invoices.pay(finalizedInvoice.id, {
            payment_method: client.stripe_payment_method_id!,
          });

          await supabase
            .from('scheduled_charges')
            .update({
              status: 'succeeded',
              stripe_invoice_id: paidInvoice.id,
              stripe_invoice_url: paidInvoice.hosted_invoice_url,
              stripe_invoice_pdf: paidInvoice.invoice_pdf,
              processed_at: new Date().toISOString(),
            })
            .eq('id', charge.id);

          results.chargesProcessed++;
        } catch (paymentError) {
          const errorMessage = paymentError instanceof Error ? paymentError.message : 'Payment failed';

          await supabase
            .from('scheduled_charges')
            .update({
              status: 'failed',
              failure_reason: errorMessage,
              processed_at: new Date().toISOString(),
            })
            .eq('id', charge.id);

          results.chargesFailed++;

          // Send failure email
          const { data: userData } = await supabase.auth.admin.getUserById(client.user_id);
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', client.user_id)
            .single();

          if (userData?.user?.email) {
            try {
              await sendEmail({
                to: userData.user.email,
                subject: 'A scheduled payment failed',
                react: ChargeFailedEmail({
                  userName: profile?.full_name || 'there',
                  amount: `$${(charge.amount_cents / 100).toFixed(2)} ${charge.currency.toUpperCase()}`,
                  description: charge.description || 'Scheduled charge',
                }),
              });
            } catch (emailError) {
              results.errors.push(`Error sending charge failed email for charge ${charge.id}: ${emailError}`);
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
      },
      { status: 500 }
    );
  }
}
