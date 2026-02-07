import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/resend';
import PaymentFailedEmail from '../../../../../emails/payment-failed';
import ChargeFailedEmail from '../../../../../emails/charge-failed';
import type Stripe from 'stripe';

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const error = err as Error;
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabaseAdmin = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const billingClientId = session.metadata?.billing_client_id;
        const scheduledChargeId = session.metadata?.scheduled_charge_id;

        if (billingClientId && scheduledChargeId) {
          // This is a billing client checkout — save payment method and mark charge
          let receiptUrl: string | null = null;

          if (session.payment_intent) {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              session.payment_intent as string,
              { expand: ['latest_charge'] }
            );
            const paymentMethodId = paymentIntent.payment_method as string | null;

            if (paymentMethodId) {
              await supabaseAdmin
                .from('billing_clients')
                .update({
                  status: 'active',
                  stripe_payment_method_id: paymentMethodId,
                })
                .eq('id', billingClientId);
            }

            // Get receipt URL from the charge for client invoice access
            const latestCharge = paymentIntent.latest_charge;
            if (latestCharge && typeof latestCharge === 'object' && 'receipt_url' in latestCharge) {
              receiptUrl = (latestCharge as Stripe.Charge).receipt_url ?? null;
            }
          }

          await supabaseAdmin
            .from('scheduled_charges')
            .update({
              status: 'succeeded',
              stripe_payment_intent_id: session.payment_intent as string,
              stripe_invoice_url: receiptUrl,
              processed_at: new Date().toISOString(),
            })
            .eq('id', scheduledChargeId);
        } else if (userId && session.customer) {
          // Regular subscription checkout
          await supabaseAdmin
            .from('profiles')
            .update({ stripe_customer_id: session.customer as string })
            .eq('id', userId);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(supabaseAdmin, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabaseAdmin, subscription);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.parent?.subscription_details?.subscription;
        if (subscriptionId && invoice.customer) {
          await supabaseAdmin
            .from('profiles')
            .update({ subscription_status: 'active' })
            .eq('stripe_customer_id', invoice.customer as string);
        }

        // Recovery path for billing client invoice charges — if the synchronous
        // update in cron/trigger failed, this webhook catches it using invoice metadata.
        const scheduledChargeId = invoice.metadata?.scheduled_charge_id;
        if (scheduledChargeId) {
          await supabaseAdmin
            .from('scheduled_charges')
            .update({
              status: 'succeeded',
              stripe_invoice_id: invoice.id,
              stripe_invoice_url: invoice.hosted_invoice_url ?? null,
              stripe_invoice_pdf: invoice.invoice_pdf ?? null,
              processed_at: new Date().toISOString(),
            })
            .eq('id', scheduledChargeId)
            .neq('status', 'succeeded');
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.parent?.subscription_details?.subscription;
        if (subscriptionId && invoice.customer) {
          const customerId = invoice.customer as string;

          // Update subscription status
          const { data: profile } = await supabaseAdmin
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_customer_id', customerId)
            .select('id, full_name')
            .single();

          // Send payment failed email
          if (profile) {
            const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
            if (userError) {
              console.error(`Failed to fetch user for payment failed email (profile: ${profile.id}):`, userError);
            } else if (!userData?.user?.email) {
              console.warn(`No email found for user ${profile.id}, cannot send payment failed email`);
            } else {
              try {
                await sendEmail({
                  to: userData.user.email,
                  subject: 'Action required: Your payment failed',
                  react: PaymentFailedEmail({
                    userName: profile.full_name || 'there',
                  }),
                });
              } catch (emailError) {
                console.error('Failed to send payment failed email:', emailError);
              }
            }
          } else {
            console.warn(`No profile found for customer ${customerId}, cannot send payment failed email`);
          }
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const chargeId = paymentIntent.metadata?.scheduled_charge_id;

        if (chargeId) {
          // Safety net for Checkout-session-based charges (first payment).
          // Invoice-based charges are recovered via invoice.payment_succeeded above.
          await supabaseAdmin
            .from('scheduled_charges')
            .update({
              status: 'succeeded',
              stripe_payment_intent_id: paymentIntent.id,
              processed_at: new Date().toISOString(),
            })
            .eq('id', chargeId)
            .neq('status', 'succeeded');
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const chargeId = paymentIntent.metadata?.scheduled_charge_id;
        const billingUserId = paymentIntent.metadata?.supabase_user_id;

        if (chargeId) {
          const failureMessage = paymentIntent.last_payment_error?.message || 'Payment failed';

          await supabaseAdmin
            .from('scheduled_charges')
            .update({
              status: 'failed',
              failure_reason: failureMessage,
              processed_at: new Date().toISOString(),
            })
            .eq('id', chargeId);

          // Get the charge details for the email
          const { data: charge } = await supabaseAdmin
            .from('scheduled_charges')
            .select('amount_cents, currency, description')
            .eq('id', chargeId)
            .single();

          if (billingUserId && charge) {
            const { data: userData } = await supabaseAdmin.auth.admin.getUserById(billingUserId);
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .select('full_name')
              .eq('id', billingUserId)
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
                console.error('Failed to send charge failed email:', emailError);
              }
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

type SupabaseAdmin = ReturnType<typeof createAdminClient>;

async function handleSubscriptionChange(
  supabaseAdmin: SupabaseAdmin,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const userId = subscription.metadata?.supabase_user_id;

  let status: string;
  switch (subscription.status) {
    case 'active':
      status = 'active';
      break;
    case 'trialing':
      status = 'trialing';
      break;
    case 'past_due':
      status = 'past_due';
      break;
    case 'canceled':
    case 'unpaid':
      status = 'canceled';
      break;
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      // These statuses mean subscription isn't active
      console.log(`Subscription status ${subscription.status} - not updating profile`);
      return;
    default:
      console.warn(`Unknown subscription status: ${subscription.status}`);
      return;
  }

  // Try to update by customer ID first
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: status })
    .eq('stripe_customer_id', customerId)
    .select('id');

  // If no rows updated and we have user ID from metadata, try that
  if ((!data || data.length === 0) && userId) {
    console.log(`No profile found for customer ${customerId}, trying user ID ${userId}`);
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: status, stripe_customer_id: customerId })
      .eq('id', userId);
  } else if (error) {
    console.error('Error updating subscription status:', error);
  }
}

async function handleSubscriptionDeleted(
  supabaseAdmin: SupabaseAdmin,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string;
  const userId = subscription.metadata?.supabase_user_id;

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({ subscription_status: 'canceled' })
    .eq('stripe_customer_id', customerId)
    .select('id');

  if ((!data || data.length === 0) && userId) {
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'canceled' })
      .eq('id', userId);
  } else if (error) {
    console.error('Error updating subscription status on delete:', error);
  }
}
