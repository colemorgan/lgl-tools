import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/resend';
import TrialEndingEmail from '../../../../../emails/trial-ending';
import TrialExpiredEmail from '../../../../../emails/trial-expired';

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
