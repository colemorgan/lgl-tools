import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/resend';
import WelcomeEmail from '../../../../emails/welcome';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if this is a new user (profile created within last 5 minutes)
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('created_at, full_name')
          .eq('id', user.id)
          .single();

        if (profile) {
          const createdAt = new Date(profile.created_at);
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

          // Send welcome email for newly created profiles
          if (createdAt > fiveMinutesAgo) {
            try {
              await sendEmail({
                to: user.email!,
                subject: 'Welcome to LGL Tools!',
                react: WelcomeEmail({
                  userName: profile.full_name || 'there',
                  trialDays: 15,
                }),
              });
            } catch (emailError) {
              // Log error but don't block the auth flow
              console.error('Failed to send welcome email:', emailError);
            }
          }
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // Return to login page with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
