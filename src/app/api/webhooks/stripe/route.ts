import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import type Stripe from 'stripe';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }

  return createClient(url, key);
}

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

  const supabaseAdmin = getSupabaseAdmin();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;

        if (userId && session.customer) {
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
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.parent?.subscription_details?.subscription;
        if (subscriptionId && invoice.customer) {
          await supabaseAdmin
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_customer_id', invoice.customer as string);
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

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

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
